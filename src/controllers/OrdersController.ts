import { Request, Response } from 'express';
import { Books } from "../models/entities/Books";
import { Orders } from "../models/entities/Orders";
import { User } from "../models/entities/User";
import { AppDataSource } from "../models/repository/Datasource";
import { Discount } from '../models/entities/Discount';
import { Bill } from "../models/entities/Bill";
import { v4 as uuidv4 } from 'uuid';
import { verifySinglePaySignature } from "../util/momo";
import { sendMail } from '../services/email';
import { singlePayAPI } from '../services/momo';
import { getValidatedPageInfo, isValidUrl } from '../util/checker';
import { IsNull, Not } from 'typeorm';
import Logger from '../util/logger';

class OrdersController {
    async IsPurcharged(user: User, book: Books): Promise<boolean> {
        try {
            const ordersRepository = (await AppDataSource.getInstance()).getRepository(Orders);

            const confirm = await ordersRepository.findOne({ where: { userId: user.id, booksId: book.id } });

            if (!confirm || !confirm.billId) return false;

            const billRepository = (await AppDataSource.getInstance()).getRepository(Bill);

            const bill = await billRepository.findOne({ where: { id: confirm.billId } });

            if (!bill || !bill.paymentDate) return false;

            return true;

        } catch (error: any) {
            console.error(`Error while fetch order: ${error}`);
            return false;
        }
    }

    async checkPurcharged(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Failed to validate" });
            return;
        }

        try {
            const ordersRepository = (await AppDataSource.getInstance()).getRepository(Orders);
            const bookRepository = (await AppDataSource.getInstance()).getRepository(Books);

            const bookid = Number(req.params.bookId);

            if (isNaN(bookid) || bookid < 0) {
                res.status(400).json({ message: `invalid book id "${bookid}"` });
            }

            const book = await bookRepository.findOne({ where: { id: bookid } });

            if (!book) {
                res.status(404).json({ message: "Book not found" });
                return;
            }

            const purcharged = await ordersRepository.findOne({ where: { userId: req.user.id, booksId: book.id } });

            if (!purcharged || !purcharged.billId) {
                res.status(404).json({ message: "Book not purcharged" });
                return;
            }

            const billRepository = (await AppDataSource.getInstance()).getRepository(Bill);
            const bill = await billRepository.findOne({ where: { id: purcharged.billId } });
            if (!bill || !bill.paymentDate) {
                res.status(404).json({ message: "Book not purcharged" });
                return;
            }

            res.status(200).json({ message: "Book purcharged", data: purcharged });

        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch order data" });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        if (!req.user.birthYear) {
            res.status(403).json({ message: "User haven't config age yet" });
            return;
        }

        try {
            const { bookIds, discountName } = req.body;

            if (!bookIds) {
                res.status(400).json({
                    message: "Missing required field",
                    data: {
                        bookIds: !bookIds ? true : false,
                    }
                });
                return;
            }

            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);
            const ordersRepository = (await AppDataSource.getInstance()).getRepository(Orders);
            const userRepository = (await AppDataSource.getInstance()).getRepository(User);
            const bookRepository = (await AppDataSource.getInstance()).getRepository(Books);
            const billRepository = (await AppDataSource.getInstance()).getRepository(Bill);

            let billId: string | null = uuidv4();
            const newBill = new Bill();
            newBill.id = billId;
            newBill.userId = req.user.id;
            newBill.createDate = (new Date).toISOString().split('T')[0];
            newBill.totalPrice = 0;
            const savedBill = await billRepository.save(newBill);

            const added = [];
            const dupplicated: number[] = [];
            const notExists: number[] = [];
            const notSell: number[] = [];
            let totalPrice: number = 0;
            let discountStatus: number = -1;
            const warning: string[] = [];
            const savedOrders: Orders[] = [];

            let discount: Discount | null = null;
            let curUser: User | null = null;

            if (discountName) {
                const foundDiscount = await discountRepository.findOne({ where: { name: discountName } });
                if (!foundDiscount) {
                    warning.push(`Discount ${discountName} not found`);
                } else {
                    const user = await userRepository.findOne({ where: { id: req.user.id }, relations: ['discounts'] });
                    if (!user) {
                        res.status(500).json({ message: "Error when apply discount" });
                        return;
                    }

                    const discountUsed = user.discounts.some(d => d.id === foundDiscount.id);

                    if (discountUsed) {
                        warning.push(`${user.name} already used ${foundDiscount.name}`);
                    } else {
                        curUser = user;
                        savedBill.discountId = foundDiscount.id;
                        discount = foundDiscount;
                        discountStatus = foundDiscount.id;
                    }
                }
            }

            for (const bookId of bookIds) {
                const existsOrder = await ordersRepository.findOne({ where: { userId: req.user.id, booksId: bookId } });
                const existsBook = await bookRepository.findOne({ where: { id: bookId } });
                if (existsOrder) {
                    dupplicated.push(bookId);
                    continue;
                }
                if (!existsBook) {
                    notExists.push(bookId);
                    continue;
                }

                const statusNumber = existsBook.status;

                if ((statusNumber & Books.SELL) === 0 || !existsBook.allowRead(req.user.birthYear)) {
                    notSell.push(bookId);
                    continue;
                }
                let newOrder = new Orders();
                newOrder.userId = req.user.id;
                newOrder.booksId = bookId;
                newOrder.billId = savedBill.id;

                const toDatabase = ordersRepository.create(newOrder);
                const savedOrder = await ordersRepository.save(toDatabase);
                savedOrders.push(savedOrder);
                added.push({
                    id: existsBook.id,
                    name: existsBook.title,
                    price: existsBook.price,
                });
                totalPrice = totalPrice + existsBook.price;
            }

            if (added.length === 0) {
                await billRepository.delete(savedBill.id);
                billId = null;
                res.status(400).json({
                    message: `Failed to create order`,
                    data: {
                        Duplicated: dupplicated,
                        NotExists: notExists,
                        NotSell: notSell,
                    },
                    warning,
                });
                return;
            }


            if (discount) {
                savedBill.totalPrice = totalPrice - (totalPrice * discount.ratio);
            } else {
                savedBill.totalPrice = totalPrice;
            }

            await billRepository.save(savedBill);

            const initMomoPayment = await singlePayAPI({
                partnerCode: process.env.MOMO_PARTNER_CODE as string,
                requestId: savedBill.id,
                amount: savedBill.totalPrice,
                orderId: savedBill.id,
                orderInfo: "Pay with momo",
                redirectUrl: `${process.env.FRONT_END_ADDR}${process.env.FRONE_END_REDIRECT_PATH}`,
                ipnUrl: `${process.env.BACK_END_ADDR}/order/confirm`,
                requestType: "captureWallet",
                extraData: "",
                lang: "vi",
            });

            let payUrl = null, deeplink = null, qrCodeUrl = null;

            if (!initMomoPayment) {
                res.status(400).json({
                    message: "Failed to create payment",
                });

                await ordersRepository.remove(savedOrders);
                await billRepository.remove(savedBill);

                return;
            }

            if (curUser && discount) {
                curUser.discounts.push(discount);

                await userRepository.save(curUser);
            }

            payUrl = initMomoPayment.payUrl;
            deeplink = initMomoPayment.deeplink;
            qrCodeUrl = initMomoPayment.qrCodeUrl;

            res.status(200).json({
                message: "Add order success",
                data: {
                    ID: savedBill.id,
                    Added: added,
                    Duplicated: dupplicated,
                    NotExists: notExists,
                    NotSell: notSell,
                    TotalPrice: savedBill.totalPrice,
                    DiscountApply: discountStatus,
                    PayUrl: payUrl,
                    DeepLink: deeplink,
                    QrCodeUrl: qrCodeUrl
                },
                warning,
            })

        } catch (error) {
            console.error("Error", error);
            res.status(500).json({ message: "Error while creating order" });
        }
    }

    async paymentResult(req: Request, res: Response): Promise<void> {
        const { orderId, resultCode, transId, message } = req.body;

        const logger = Logger.getInstance();

        const isValidSignature = verifySinglePaySignature(req.body);
        if (!isValidSignature) {
            res.status(400).json({ message: "Invalid signature" });
            return;
        }
        res.status(204).send();

        try {
            const dataSource = await AppDataSource.getInstance();
            const billRepository = dataSource.getRepository(Bill);

            const bill = await billRepository.findOne({ where: { id: orderId }, relations: ['user', 'orders'] });

            if (!bill) {
                logger.error("Unexpected removal of bill:", orderId);
                return;
            }

            if (resultCode === 0) {
                logger.info(`Bill ${orderId} success`);
                bill.paymentDate = (new Date()).toISOString().split('T')[0];
                bill.transId = transId;
                await billRepository.save(bill);
                await sendMail(bill.user.email, "Your order has been successfully charged", "Payment notification");
            } else {
                const ordersRepository = dataSource.getRepository(Orders);

                logger.warn(`Bill ${orderId} has failed with code ${resultCode}: ${message}`);

                await sendMail(bill.user.email, "Your order charge failed", "Payment notification");

                if (bill.discount) {
                    await dataSource
                        .createQueryBuilder()
                        .relation(User, 'discounts')
                        .of(bill.userId)
                        .remove(bill.discountId);
                }

                await ordersRepository.remove(bill.orders);
                await billRepository.remove(bill);
            }

        } catch (error: any) {
            console.error('Error handling IPN:', error);
        }
    }

    async boughtBooks(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const ordersRepository = (await AppDataSource.getInstance()).getRepository(Orders);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            // Query to find orders by userId, where billId is not null, and bill's paymentDate is not null
            const [orders, total] = await ordersRepository.createQueryBuilder("orders")
                .innerJoinAndSelect("orders.bill", "bill")
                .innerJoinAndSelect("orders.books", "books")
                .where("orders.userId = :userId", { userId: req.user.id })
                .andWhere("orders.billId IS NOT NULL")
                .andWhere("bill.paymentDate IS NOT NULL")
                // .select(["books.id", "books.title"])
                .skip(offset)
                .take(pageSize)
                .getManyAndCount();

            // Extract book details
            const boughtBooks = orders.map(order => ({
                BookID: order.books.id,
                Title: order.books.title,
                Price: order.books.price,
                cover_url: order.books.coverUrl,
                PageCount: order.books.pageCount,
            }));

            res.status(200).json({ message: "Success", data: boughtBooks, total, page, pageSize });
        } catch (error) {
            console.error("Error while fetching bought books:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

}

export default new OrdersController;
