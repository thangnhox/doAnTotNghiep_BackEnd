import { Request, Response } from 'express';
import { Publisher } from '../models/entities/Publisher';
import { checkReqUser } from '../util/checker';
import { AppDataSource } from '../models/repository/Datasource';

class PublisherController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const publisherRepository = (await AppDataSource.getInstace()).getRepository(Publisher);

            const page = parseInt(req.query.page as string, 10) || 1;
            const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
            const offset = (page - 1) * pageSize;

            const [publishers, total] = await publisherRepository.findAndCount({
                relations: ['books'],
                take: pageSize,
                skip: offset,
            });

            if (publishers.length === 0) {
                res.status(404).json({ message: "Out of bounds" });
                return;
            }

            const detail = req.query.detail === 'true';

            const formattedPublishers = publishers.map(publisher => {
                if (detail) {
                    const bookCount = publisher.books.length;
                    const booksDisplay = bookCount > 3
                        ? [...publisher.books.slice(0, 3), { title: '...more', id: null }]
                        : publisher.books;
                    return {
                        id: publisher.id,
                        name: publisher.name,
                        booklist: booksDisplay,
                        books: bookCount
                    };
                } else {
                    return {
                        id: publisher.id,
                        name: publisher.name,
                        books: publisher.books.length
                    }
                }
            });

            res.status(200).json({ message: "fetch success", data: formattedPublishers, total, page, pageSize });
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch publishers", error: error.message });
        }
    }

    async add(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        if (!req.body.publisherName) {
            res.status(400).send("invalid request");
            return;
        }

        const publisherRepository = (await AppDataSource.getInstace()).getRepository(Publisher);
        const publisher = await publisherRepository.findOne({ where: { name: req.body.publisherName } });

        if (publisher !== null) {
            res.status(409).json({ message: "Publisher already exist", data: publisher });
            return;
        }

        let newPublisher = new Publisher();
        newPublisher.name = req.body.publisherName;
        const toDatabase = publisherRepository.create(newPublisher);

        try {
            const savedPublisher = await publisherRepository.save(toDatabase);

            res.status(201).json({ message: "Add publisher success", data: savedPublisher });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to add publisher", error: error });
        }
    }

    async findPublisher(req: Request, res: Response): Promise<void> {
        try {
            const publisherRepository = (await AppDataSource.getInstace()).getRepository(Publisher);
            const { name } = req.params;
            const exact = req.query.exact === 'true';
            const detail = req.query.detail === 'true';

            if (exact) {
                const publisher = await publisherRepository.findOne({
                    where: { name },
                    relations: ['books']
                });

                if (!publisher) {
                    res.status(404).json({ message: "Publisher not found" });
                    return;
                }

                if (detail) {
                    const bookCount = publisher.books.length;
                    const booksDisplay = bookCount > 3
                        ? [...publisher.books.slice(0, 3), { title: '...more', id: null }]
                        : publisher.books;
                    res.status(200).json({
                        message: "Publisher found", data: {
                            id: publisher.id,
                            name: publisher.name,
                            booklist: booksDisplay,
                            books: bookCount
                        }
                    });
                } else {
                    res.status(200).json({
                        message: "Publisher found",
                        data: {
                            id: publisher.id,
                            name: publisher.name,
                            books: publisher.books.length
                        }
                    });
                }

            } else {
                const page = parseInt(req.query.page as string, 10) || 1;
                const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
                const offset = (page - 1) * pageSize;
                const [publishers, total] = await publisherRepository.createQueryBuilder("publisher")
                    .leftJoinAndSelect("publisher.books", "book")
                    .where("publisher.name LIKE :name", { name: `%${name}%` })
                    .skip(offset).take(pageSize).getManyAndCount();

                if (publishers.length === 0) {
                    res.status(404).json({ message: "No publishers found" });
                    return;
                }

                const formattedPublishers = publishers.map(publisher => {
                    if (detail) {
                        const bookCount = publisher.books.length;
                        const booksDisplay = bookCount > 3
                            ? [...publisher.books.slice(0, 3), { title: '...more', id: null }]
                            : publisher.books;
                        return {
                            id: publisher.id,
                            name: publisher.name,
                            booklist: booksDisplay,
                            books: bookCount
                        };
                    } else {
                        return {
                            id: publisher.id,
                            name: publisher.name,
                            books: publisher.books.length
                        }
                    }
                });

                res.status(200).json({ message: "Publishers found", data: formattedPublishers, total, page, pageSize });
            }
        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch publisher(s)", error: error.message });
        }
    }

    async fetch(req: Request, res: Response): Promise<void> {
        try {
            const publisherRepository = (await AppDataSource.getInstace()).getRepository(Publisher);
            const { id } = req.params;
            const detail = req.query.detail === 'true';

            const publisher = await publisherRepository.findOne({
                where: { id: Number(id) },
                relations: ['books']
            });

            if (!publisher) {
                res.status(404).json({ message: "Publisher not found" });
                return;
            }

            if (detail) {
                const bookCount = publisher.books.length;
                const booksDisplay = bookCount > 3
                    ? [...publisher.books.slice(0, 3), { title: '...more', id: null }]
                    : publisher.books;
                res.status(200).json({
                    message: "Publisher found", data: {
                        id: publisher.id,
                        name: publisher.name,
                        booklist: booksDisplay,
                        books: bookCount
                    }
                });
            } else {
                res.status(200).json({
                    message: "Publisher found",
                    data: {
                        id: publisher.id,
                        name: publisher.name,
                        books: publisher.books.length
                    }
                });
            }

        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch publisher", error: error.message });
        }
    }
}

export default new PublisherController;