import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Books } from '../models/entities/Books';
import { Publisher } from '../models/entities/Publisher';
import { checkReqUser } from '../util/checker';

class BooksController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const booksRepository = (await AppDataSource.getInstace()).getRepository(Books);

            const page = parseInt(req.query.page as string, 10) || 1;
            const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
            const offset = (page - 1) * pageSize;

            const [books, total] = await booksRepository.findAndCount({
                take: pageSize,
                skip: offset
            });

            if (books.length === 0) {
                res.status(404).json({message: "out of bounds"});
                return;
            }

            res.status(200).json({ message: "fetch success", data: books, total, page, pageSize });
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch books", error: error.message });
        }
    }

    async add(req: Request, res: Response): Promise<void> { // NOTE: Chưa test, chưa có data mẫu
        if (!checkReqUser(req, res)) return;

        if (
            !req.body.title ||
            !req.body.price ||
            !req.body.fileUrl ||
            !req.body.publisherId
        ) {
            res.status(400).send("invalid request");
            return;
        }

        if (!req.body.status) {
            req.body.status = 3;
        }

        if (!req.body.publishDate) {
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().split('T')[0];
            req.body.publishDate = formattedDate;
        }

        

        const publisherRepository = (await AppDataSource.getInstace()).getRepository(Publisher);
        const publisher = await publisherRepository.findOne({ where: { id: req.body.publisherId } });

        if (!publisher) {
            res.status(404).json({ message: "Publisher not found" });
            return;
        }

        try {
            const booksRepository = (await AppDataSource.getInstace()).getRepository(Books);
            const book = await booksRepository.findOne({ where: { title: req.body.title } });
            if (book != null) {
                res.status(400).json({message: "Book title exists", data: book});
                return;
            }

            let newBook = new Books();
            newBook.title = req.body.title;
            newBook.price = req.body.price;
            newBook.fileUrl = req.body.fileUrl;
            newBook.publisherId = req.body.publisherId;
            newBook.publishDate = req.body.publishDate;
            newBook.status = req.body.status;

            if (req.body.coverUrl != null) {
                newBook.coverUrl = req.body.coverUrl;
            }

            const toDatabase = booksRepository.create(newBook);
            const savedBook = await booksRepository.save(toDatabase);

            res.status(201).json({message: "Book add success", data: savedBook});
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch books", error: error.message });
        }
    }

}

export default new BooksController;