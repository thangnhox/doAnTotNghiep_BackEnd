import { Request, Response } from 'express';
import { Publisher } from '../models/entities/Publisher';
import { checkReqUser, getValidatedPageInfo, sortValidator } from '../util/checker';
import { AppDataSource } from '../models/repository/Datasource';

class PublisherController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const publisherRepository = (await AppDataSource.getInstance()).getRepository(Publisher);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Publisher);

            const [publishers, total] = await publisherRepository.findAndCount({
                relations: ['books'],
                take: pageSize,
                skip: offset,
                order: {
                    [sort]: order.toUpperCase() as 'ASC' | 'DESC'
                }
            });

            if (publishers.length === 0 && total > 0) {
                res.status(416).json({ message: "Out of bounds" });
                return;
            }

            const detail = req.query.detail === 'true';

            const formattedPublishers = publishers.map(publisher => {
                if (detail) {
                    const bookCount = publisher.books.length;
                    const booklist = publisher.books.map(book => {
                        return {
                            id: book.id,
                            title: book.title,
                        };
                    });
                    const booksDisplay = bookCount > 3
                        ? [...booklist.slice(0, 3), { title: '...more', id: null }]
                        : booklist;
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

            res.status(200).json({
                message: "fetch success",
                data: formattedPublishers,
                total, page, pageSize,
                warnings
            });
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch publishers", error: error.message });
        }
    }

    async add(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        if (!req.body.publisherName) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        const publisherRepository = (await AppDataSource.getInstance()).getRepository(Publisher);
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
            const publisherRepository = (await AppDataSource.getInstance()).getRepository(Publisher);
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
                    const booklist = publisher.books.map(book => {
                        return {
                            id: book.id,
                            title: book.title,
                        };
                    });
                    const booksDisplay = bookCount > 3
                        ? [...booklist.slice(0, 3), { title: '...more', id: null }]
                        : booklist;
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
                const { page, pageSize, offset } = getValidatedPageInfo(req.query);

                const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Publisher);

                const [publishers, total] = await publisherRepository.createQueryBuilder("publisher")
                    .leftJoinAndSelect("publisher.books", "book")
                    .where("publisher.name LIKE :name", { name: `%${name}%` })
                    .orderBy(`publisher.${sort}`, order.toUpperCase() as 'ASC' | 'DESC')
                    .skip(offset).take(pageSize).getManyAndCount();

                if (publishers.length === 0) {
                    res.status(404).json({ message: "No publishers found" });
                    return;
                }

                const formattedPublishers = publishers.map(publisher => {
                    if (detail) {
                        const bookCount = publisher.books.length;
                        const booklist = publisher.books.map(book => {
                            return {
                                id: book.id,
                                title: book.title,
                            };
                        });
                        const booksDisplay = bookCount > 3
                            ? [...booklist.slice(0, 3), { title: '...more', id: null }]
                            : booklist;
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

                res.status(200).json({ message: "Publishers found", data: formattedPublishers, total, page, pageSize, warnings });
            }
        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch publisher(s)", error: error.message });
        }
    }

    async fetch(req: Request, res: Response): Promise<void> {
        try {
            const publisherRepository = (await AppDataSource.getInstance()).getRepository(Publisher);
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
                const booklist = publisher.books.map(book => {
                    return {
                        id: book.id,
                        title: book.title,
                    };
                });
                const booksDisplay = bookCount > 3
                    ? [...booklist.slice(0, 3), { title: '...more', id: null }]
                    : booklist;
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

    async edit(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        try {
            const publisherRepository = (await AppDataSource.getInstance()).getRepository(Publisher);

            // Find the publisher by ID
            const publisher = await publisherRepository.findOne({ where: { id: Number(id) } });

            if (!publisher) {
                res.status(404).json({ message: 'Publisher not found' });
                return;
            }

            // Check for duplicate publisher name
            const existingPublisher = await publisherRepository.findOne({ where: { name } });
            if (existingPublisher && existingPublisher.id !== publisher.id) {
                res.status(409).json({ message: 'Publisher name already exists' });
                return;
            }

            // Update publisher name
            publisher.name = name;

            const savedPublisher = await publisherRepository.save(publisher);

            res.status(200).json({ message: 'Publisher updated successfully', data: savedPublisher });
        } catch (error: any) {
            res.status(500).json({ message: 'Failed to update publisher', error: error.message });
        }
    }
}

export default new PublisherController;