import { Request, Response } from 'express';
import { Books } from "../models/entities/Books";
import { Orders } from "../models/entities/Orders";
import { User } from "../models/entities/User";
import { AppDataSource } from "../models/repository/Datasource";

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

            if (!purcharged) {
                res.status(404).json({ message: "Book not purcharged" });
                return;
            }

            res.status(200).json({ message: "Book purcharged", data: purcharged });

        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch order data" });
        }
    }
}

export default new OrdersController;