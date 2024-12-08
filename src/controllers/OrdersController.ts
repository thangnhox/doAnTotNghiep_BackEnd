import { Request, Response } from 'express';
import { Books } from "../models/entities/Books";
import { Orders } from "../models/entities/Orders";
import { User } from "../models/entities/User";
import { AppDataSource } from "../models/repository/Datasource";
import { Discount } from '../models/entities/Discount';
import { Bill } from "../models/entities/Bill";
import { v4 as uuidv4 } from 'uuid';
import { verifySignature } from "../util/momo";
import UserController from './UserController';
import { sendMail } from '../services/email';

class OrdersController {
    async IsPurcharged(user: User, book: Books): Promise<boolean> {
        try {
            const ordersRepository = (await AppDataSource.getInstace()).getRepository(Orders);

            const confirm = await ordersRepository.findOne({ where: { userId: user.id, booksId: book.id } });

            if (!confirm || !confirm.billId) return false;

			const billRepository = (await AppDataSource.getInstace()).getRepository(Bill);

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

            if (!purcharged || !purcharged.billId) {
                res.status(404).json({ message: "Book not purcharged" });
                return;
            }

			const billRepository = (await AppDataSource.getInstace()).getRepository(Bill);
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
            const { bookIds, discountId } = req.body;

            const discountRepository = (await AppDataSource.getInstace()).getRepository(Discount);
            const ordersRepository = (await AppDataSource.getInstace()).getRepository(Orders);
            const userRepository = (await AppDataSource.getInstace()).getRepository(User);
            const bookRepository = (await AppDataSource.getInstace()).getRepository(Books);
			const billRepository = (await AppDataSource.getInstace()).getRepository(Bill);

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
                await ordersRepository.save(toDatabase);
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

			await billRepository.save(newBill);

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
                },
                warning,
            })

        } catch (error) {
            console.error("Error", error);
            res.status(500).json({ message: "Error while creating order" });
        }
    }

	async paymentResult(req: Request, res: Response): Promise<void> {
		const { orderId, resultCode, transId } = req.body;

		const isValidSignature = verifySignature(req.body);
		if (!isValidSignature) {
			res.status(400).json({ message: "Invalid signature" });
			return;
		}
        res.status(204).send();

		try {
			const billRepository = (await AppDataSource.getInstace()).getRepository(Bill);

			if (resultCode === 0) {
				const bill = await billRepository.findOne({ where: { id: orderId }, relations: ['user'] });
				if (!bill) {
                    console.error("Unexpected removal of bill:", orderId);
					return;
				}

				bill.paymentDate = (new Date()).toISOString().split('T')[0];
                bill.transId = transId;
				await billRepository.save(bill);
                await sendMail(bill.user.email, "Your order has success fully purcharged");
			}

		} catch (error: any) {
			console.error('Error handling IPN:', error);
		}
	}
}

export default new OrdersController;
