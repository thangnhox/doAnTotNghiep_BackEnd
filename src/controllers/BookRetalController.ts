import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Discount } from '../models/entities/Discount';
import { User } from '../models/entities/User';
import { BookRental } from '../models/entities/BookRental';
import { Subscribe } from '../models/entities/Subscribe';
import { Books } from '../models/entities/Books';
import { v4 as uuidv4 } from 'uuid';
import { singlePayAPI } from '../services/momo';
import MembershipController from './MembershipController';
import { scheduleTaskJob, TimeDelay } from '../services/tasks';
import { sendMail } from '../services/email';
import { getDateFromToday, getDateNDaysAhead, getValidatedPageInfo } from '../util/checker';
import Logger from '../util/logger';
import { verifySinglePaySignature } from '../util/momo';

class BookRentalController {
    async rent(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { bookId, discountName, days } = req.body;

            if (!bookId) {
                res.status(400).json({ message: "Invalid request" });
                return;
            }

            const dataSource = await AppDataSource.getInstance();
            const discountRepository = dataSource.getRepository(Discount);
            const userRepository = dataSource.getRepository(User);
            const subscribeRepository = dataSource.getRepository(Subscribe);
            const booksRepository = dataSource.getRepository(Books);

            const book = await booksRepository.findOne({ where: { id: bookId } });

            if (!book || !days) {
                res.status(404).json({ message: "Book not found" });
                return;
            }

            const rent = new Subscribe;
            rent.id = uuidv4();
            rent.userId = req.user.id;
            rent.date = (new Date).toISOString().split('T')[0];
            rent.totalPrice = book.price * 0.05 * Number(days);

            const warning: string[] = [];
            let discount: Discount | null = null;
            let curUser: User | null = null;
            let discountStatus: number = -1;

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
                    } else if (foundDiscount.status === 0) {
                        warning.push(`${foundDiscount.name} is no longer usable`);
                    } else {
                        curUser = user;
                        discount = foundDiscount;
                        discountStatus = foundDiscount.id;
                        rent.totalPrice = rent.totalPrice - (rent.totalPrice * foundDiscount.ratio);
                    }
                }
            }

            const initMomoPayment = await singlePayAPI({
                partnerCode: process.env.MOMO_PARTNER_CODE as string,
                requestId: rent.id,
                amount: rent.totalPrice,
                orderId: rent.id,
                orderInfo: "Pay with momo",
                redirectUrl: `${process.env.FRONT_END_ADDR}${process.env.FRONE_END_REDIRECT_PATH}`,
                ipnUrl: `${process.env.BACK_END_ADDR}/bookrental/confirm`,
                requestType: "captureWallet",
                extraData: "",
                lang: "vi",
            });

            let payUrl = null, deeplink = null, qrCodeUrl = null;

            if (!initMomoPayment) {
                res.status(400).json({
                    message: "Failed to create payment",
                });

                return;
            }

            await subscribeRepository.save(rent);
            if (curUser && discount) {
                curUser.discounts.push(discount);
                await userRepository.save(curUser);
            }

            payUrl = initMomoPayment.payUrl;
            deeplink = initMomoPayment.deeplink;
            qrCodeUrl = initMomoPayment.qrCodeUrl;

            res.status(200).json({
                message: "Success",
                data: {
                    ID: rent.id,
                    TotalPrice: rent.totalPrice,
                    DiscountApply: discountStatus,
                    PayUrl: payUrl,
                    DeepLink: deeplink,
                    QrCodeUrl: qrCodeUrl
                },
                warning,
            })

            scheduleTaskJob(TimeDelay.TWO_HOURS, MembershipController.timeout, rent.id);

        } catch (error) {
            console.error("Error while creating rental request", error);
            res.status(500).json({ message: "Error while handling rental request" });
        }
    }

    async confirm(req: Request, res: Response): Promise<void> {
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
            const subscribeRepository = dataSource.getRepository(Subscribe);

            const bill = await subscribeRepository.findOne({ where: { id: orderId }, relations: ['user'] });

            if (!bill) {
                logger.error("Unexpected removal of bill:", orderId);
                return;
            }

            if (!bill.booksId) {
                logger.error(`${bill.id} is not book rental transaction`);
                return;
            }

            const booksRepository = dataSource.getRepository(Books);
            const book = await booksRepository.findOne({ where: { id: bill.booksId } });

            if (!book) {
                logger.error(`Book ${bill.booksId} not found`);
                return;
            }

            const basePrice = book.price * 0.05;
            let price: number = bill.totalPrice;

            if (bill.discountId) {
                const discountRepository = dataSource.getRepository(Discount);
                const discount = await discountRepository.findOne({ where: { id: bill.discountId } });

                if (!discount) {
                    logger.error(`${bill.discountId} not found`);
                    return;
                }

                price = price / (1 - discount.ratio);
            }

            const days = price / basePrice;

            if (resultCode === 0) {
                const bookrentalRepository = dataSource.getRepository(BookRental);
                const rent = await bookrentalRepository.findOne({ where: { userId: bill.userId, booksId: bill.booksId } });

                if (rent) {
                    rent.expireDate = getDateNDaysAhead(rent.expireDate, days);
                    sendMail(bill.user.email, `Your ${book.title} rental has been extended to ${rent.expireDate}`, "Book rental extend notification");

                    bookrentalRepository.save(rent);
                } else {
                    const newRent = new BookRental();

                    newRent.userId = bill.userId;
                    newRent.booksId = bill.booksId;
                    newRent.expireDate = getDateFromToday(days);
                    sendMail(
                        bill.user.email,
                        `Your ${book.title} retal success, valid until ${newRent.expireDate}`,
                        "Book rental notification"
                    );
                    await bookrentalRepository.save(newRent);
                }

                bill.transId = transId;
                await subscribeRepository.save(bill);

            } else {
                await sendMail(bill.user.email, "Book rental failed", "Payment notification");

                logger.warn(`Bill ${orderId} has failed with code ${resultCode}: ${message}`);

                if (bill.discount) {
                    await dataSource
                        .createQueryBuilder()
                        .relation(User, 'discounts')
                        .of(bill.userId)
                        .remove(bill.discountId);
                }

                await subscribeRepository.remove(bill);
            }
        } catch (error) {
            console.error('Error handling IPN:', error);
        }
    }

    async rentedBooks(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const dataSource = await AppDataSource.getInstance();
            const bookrentalRepository = dataSource.getRepository(BookRental);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const [rents, total] = await bookrentalRepository.findAndCount({
                where: { userId: req.user.id },
                relations: ['books'],
                take: pageSize,
                skip: offset,
            });

            const formattedBooks = rents.map(rent => ({
                BookID: rent.books.id,
                Title: rent.books.title,
                Price: rent.books.price,
                cover_url: rent.books.coverUrl,
                PageCount: rent.books.pageCount,
                Rent_expire: rent.expireDate,
            }));

            res.status(200).json({
                message: "Success",
                data: formattedBooks,
                total,
                page,
                pageSize
            })
        } catch (error) {
            console.error("Error while creating rental request", error);
            res.status(500).json({ message: "Error while getting rental books" });
        }
    }

    async isRented(user: User, book: Books): Promise<boolean> {

        try {
            const Datasource = await AppDataSource.getInstance();
            const bookrentalRepository = Datasource.getRepository(BookRental);
            const rent = await bookrentalRepository.findOne({ where: { userId: user.id, booksId: book.id } });
    
            if (!rent) return false;
            return true;
        } catch (error) {
            console.error("Error while checking rental book", error);
            return false;
        }
    }

    async check(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { id } = req.params;

            const dataSource = await AppDataSource.getInstance();
            const booksRepository = dataSource.getRepository(Books);

            const book = await booksRepository.findOne({ where: { id: Number(id) } });

            if (!book) {
                res.status(404).json({ message: "Book not found" });
                return;
            }

            const rented = await this.isRented(req.user, book);

            if (!rented) {
                res.status(404).json({
                    message: "Book is not rented",
                });
                return;
            }

            res.status(200).json({ message: "Book is rented" });

        } catch (error) {
            console.error("Error while handling rental check request", error);
            res.status(500).json({ message: "Error while checking rental books" });
        }
    }

    async dailyCheck(): Promise<void> {
        const logger = Logger.getInstance();

        logger.info("Start daily book retal check");

        try {
            const dataSource = await AppDataSource.getInstance();
            const bookrentalRepository = dataSource.getRepository(BookRental);

            const toDay = (new Date()).toISOString().split('T')[0];

            const rents = await bookrentalRepository.find({ where: { expireDate: toDay } })

            for (const rent of rents) {
                logger.warn(`The rental for book ID ${rent.booksId} by user ID ${rent.userId} has expired.`);
            }

            await bookrentalRepository.remove(rents);

        } catch (error: any) {
            logger.error("Error while perform daily check for rental book:", error.message);
        } finally {
            logger.info("Daily book retal check done!");
        }
    }
}

export default new BookRentalController;