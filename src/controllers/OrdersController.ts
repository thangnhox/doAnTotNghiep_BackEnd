import { Request, Response } from 'express';
import { Books } from "../models/entities/Books";
import { Orders } from "../models/entities/Orders";
import { User } from "../models/entities/User";
import { AppDataSource } from "../models/repository/Datasource";
import { Discount } from '../models/entities/Discount';

class OrdersController {
    async IsPurcharged(user: User, book: Books): Promise<boolean> {
        try {
            const ordersRepository = (await AppDataSource.getInstace()).getRepository(Orders);

            const confirm = await ordersRepository.findOne({ where: { userId: user.id, booksId: book.id } });

            if (!confirm) return false;

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
            const ordersRepository = (await AppDataSource.getInstace()).getRepository(Orders);
            const bookRepository = (await AppDataSource.getInstace()).getRepository(Books);

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

            if (!purcharged || purcharged.paymentDate === null) {
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

        try {
            const { bookIds, discountId } = req.body;

            const discountRepository = (await AppDataSource.getInstace()).getRepository(Discount);
            const ordersRepository = (await AppDataSource.getInstace()).getRepository(Orders);
            const userRepository = (await AppDataSource.getInstace()).getRepository(User);
            const bookRepository = (await AppDataSource.getInstace()).getRepository(Books);

            const idAdded: number[] = [];
            const idDup: number[] = [];
            const idNotExists: number[] = [];
            const idNotSell: number[] = [];
            let discountStatus: number = -1;
            const warning: string[] = [];

            let discount: Discount | null = null;

            if (discountId) {
                const foundDiscount = await discountRepository.findOne({ where: { id: discountId } });
                if (!foundDiscount) {
                    warning.push(`Discount ${discountId} not found`);
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
                        user.discounts.push(foundDiscount);
                        await userRepository.save(user);
                        discount = foundDiscount;
                        discountStatus = discount.id;
                    }
                }
            }

            for (const bookId of bookIds) {
                const existsOrder = await ordersRepository.findOne({ where: { userId: req.user.id, booksId: bookId } });
                const existsBook = await bookRepository.findOne({ where: { id: bookId } });
                if (existsOrder) {
                    idDup.push(bookId);
                    continue;
                }
                if (!existsBook) {
                    idNotExists.push(bookId);
                    continue;
                }

                const statusNumber = existsBook.status.readUInt8(0);

                if ((statusNumber & Books.SELL) === 0) {
                    idNotSell.push(bookId);
                    continue;
                }
                let newOrder = new Orders();
                newOrder.userId = req.user.id;
                newOrder.booksId = bookId;
                if (discount) {
                    newOrder.discountId = discount.id;
                    newOrder.totalPrice = existsBook.price - (existsBook.price * discount.ratio);
                } else {
                    newOrder.totalPrice = existsBook.price;
                }
                newOrder.createDate = (new Date()).toISOString().split('T')[0];

                const toDatabase = ordersRepository.create(newOrder);
                await ordersRepository.save(toDatabase);
                idAdded.push(bookId);
            }

            res.status(200).json({
                message: "Add order success",
                data: {
                    Added: idAdded,
                    Duplicated: idDup,
                    NotExists: idNotExists,
                    NotSell: idNotSell,
                    DiscountApply: discountStatus
                },
                warning
            })

        } catch (error) {
            console.error("Error", error);
            res.status(500).json({ message: "Error while creating order" });
        }
    }
}

export default new OrdersController;