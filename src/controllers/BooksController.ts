import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Books } from '../models/entities/Books';
import { Publisher } from '../models/entities/Publisher';
import { checkReqUser, getValidateBookPage, getValidatedPageInfo, sortValidator } from '../util/checker';
import { Authors } from '../models/entities/Authors';
import { BookDetails } from '../models/views/BookDetails';
import { Category } from '../models/entities/Category';
import PDFCache from '../services/pdfcacher';
import { convertPdfPage2Image } from '../util/pdf2img';
import fs from 'fs';
import MembershipController from './MembershipController';
import OrderaController from './OrdersController';
import OrdersController from './OrdersController';

class BooksController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const booksRepository = (await AppDataSource.getInstance()).getRepository(BookDetails);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);
            const fields = req.query.fields ? (req.query.fields as string).split(',') : null;

            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, BookDetails);

            // Validate requested fields
            let selectFields = [];
            if (fields && fields.length > 0) {
                let validFields = fields.filter(field => BookDetails.validSortColumn.includes(field.trim()));
                validFields = validFields.filter(field => field.trim() !== 'file_url'); // Always exclude 'file_url'

                const invalidFields = fields.filter(field => !validFields.includes(field.trim()));
                if (invalidFields.length > 0) {
                    res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
                    return;
                }
                selectFields = validFields.map(field => `BookDetails.${field.trim()}`);
            } else {
                selectFields = BookDetails.validSortColumn
                    .filter(field => field !== 'file_url') // Always exclude 'file_url'
                    .map(field => `BookDetails.${field}`);
            }

            const [books, total] = await booksRepository.createQueryBuilder('BookDetails')
                .select(selectFields)
                .orderBy(`BookDetails.${sort}`, order.toUpperCase() as 'ASC' | 'DESC')
                .take(pageSize)
                .skip(offset)
                .getManyAndCount();

            if (books.length === 0) {
                res.status(404).json({ message: "out of bounds" });
                return;
            }

            res.status(200).json({ message: "fetch success", data: books, total, page, pageSize, warnings });
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch books", error: error.message });
        }
    }


    async add(req: Request, res: Response): Promise<void> { // NOTE: Chưa test, chưa có data mẫu
        if (!checkReqUser(req, res)) return;

        try {
            const bookRepository = (await AppDataSource.getInstance()).getRepository(Books);
            const authorRepository = (await AppDataSource.getInstance()).getRepository(Authors);
            const publisherRepository = (await AppDataSource.getInstance()).getRepository(Publisher);
            const categoryRepository = (await AppDataSource.getInstance()).getRepository(Category);

            const { title, description, pageCount, price, fileUrl, coverUrl, status, authorsId, publisherId, publishDate, isRecommended, categoryIds, rank } = req.body;

            // Validate required fields
            if (!title || !description || !pageCount || !price || !fileUrl || !authorsId || !publisherId || !publishDate || !categoryIds || !rank) {
                res.status(400).json({ message: "Title, Description, PageCount, Price, FileUrl, AuthorsID, PublisherID, PublishDate, and CategoryID are required." });
                return;
            }

            // Check for existing book with the same title, authorsId, and publisherId
            const existingBook = await bookRepository.findOne({ where: { title, authorsId, publisherId }, relations: ['categories'] });
            if (existingBook) {
                res.status(409).json({ message: "A book with the same title, author, and publisher already exists.", data: existingBook });
                return;
            }

            // Ensure the provided author and publisher exist
            const author = await authorRepository.findOne({ where: { id: authorsId } });
            if (!author) {
                res.status(404).json({ message: "Author not found." });
                return;
            }

            const publisher = await publisherRepository.findOne({ where: { id: publisherId } });
            if (!publisher) {
                res.status(404).json({ message: "Publisher not found." });
                return;
            }

            const categories: Category[] = [];
            for (const categoryId of categoryIds) {
                const category = await categoryRepository.findOne({ where: { id: categoryId } });
                if (category) {
                    categories.push(category);
                }
            }

            const byteStatus = status & 0xFF;

            const newBook = new Books();
            newBook.title = title;
            newBook.description = description;
            newBook.pageCount = pageCount;
            newBook.price = price;
            newBook.fileUrl = fileUrl;
            newBook.coverUrl = coverUrl || null;
            newBook.status = byteStatus;
            newBook.authorsId = authorsId;
            newBook.publisherId = publisherId;
            newBook.publishDate = (new Date(publishDate)).toISOString().split('T')[0];
            newBook.isRecommended = isRecommended || 0;
            newBook.categories = categories;
            newBook.rank = rank;

            const savedBook = await bookRepository.save(newBook);

            res.status(201).json({ message: "Book added successfully", data: savedBook });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to add book", error: error.message });
        }
    }

    async fetch(req: Request, res: Response): Promise<void> {
        try {
            const booksRepository = (await AppDataSource.getInstance()).getRepository(BookDetails);

            const bookId = req.params.id;
            const fields = req.query.fields ? (req.query.fields as string).split(',') : null;

            let selectFields = [];
            if (fields && fields.length > 0) {
                let validFields = fields.filter(field => BookDetails.validSortColumn.includes(field.trim()));
                validFields = validFields.filter(field => field.trim() !== 'file_url');

                const invalidFields = fields.filter(field => !validFields.includes(field.trim()));
                if (invalidFields.length > 0) {
                    res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
                    return;
                }
                selectFields = validFields.map(field => `BookDetails.${field.trim()}`);
            } else {
                selectFields = BookDetails.validSortColumn
                    .filter(field => field !== 'file_url')
                    .map(field => `BookDetails.${field}`);
            }

            const book = await booksRepository.createQueryBuilder('BookDetails')
                .select(selectFields)
                .where('BookDetails.BookID = :id', { id: bookId })
                .getOne();

            if (!book) {
                res.status(404).json({ message: "Book not found" });
                return;
            }

            res.status(200).json({ message: "fetch success", data: book });
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch book", error: error.message });
        }
    }

    async read(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const { page, width, height, density } = getValidateBookPage(req.query);

        if (!req.user) {
            res.status(500).json({ message: "failed to get authenticated" });
            return;
        }

        if (!id) {
            res.status(400).json({ message: 'Missing id parameter' });
            return;
        }

        if (width < 600 || height < 600 || density < 100) {
            res.status(600).json({ message: "size is too small (min 600 width and 600 height and 100 density)" });
            return;
        }

        try {
            const bookRepository = (await AppDataSource.getInstance()).getRepository(Books);
            const book = await bookRepository.findOne({ where: { id: Number(id) } });

            if (!book) {
                res.status(404).json({ message: 'Book not found' });
                return;
            }

            if (!req.user.birthYear || !book.allowRead(req.user.birthYear)) {
                res.status(403).json({ message: "This book is age restricted" });
                return;
            }

            const isMemberShip = await MembershipController.isValidUser(req.user);
            const isPurcharged = await OrderaController.IsPurcharged(req.user, book);

            if (!isMemberShip && !isPurcharged) {
                res.status(403).json({ message: `${req.user.name} is not a membership nor purcharged the book.` });
                return;
            }

            if (page > book.pageCount) {
                res.status(400).json({ message: "Out of bound" });
                return;
            }

            const pdfCache = PDFCache.getInstance();
            const pdfPath = await pdfCache.loadAndCachePDF(book.fileUrl, book.id);

            const image = await convertPdfPage2Image(pdfPath, page, `${PDFCache.getCacheDir()}/${id}.d`, { width, height, density });

            if (image === null) {
                res.status(500).json({ message: "Failed to read book" });
                return;
            }

            if (image.path === null) {
                res.status(500).json({ message: "Failed to prepare page" });
                return;
            }

            console.log(`result image path: ${image.path}`);

            res.setHeader('Content-Type', 'image/png');

            fs.createReadStream(image.path as string).pipe(res);

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Error reading PDF file', error: error.message });
        }
    }

    async edit(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { id } = req.params;
        const { title, description, pageCount, price, fileUrl, coverUrl, status, authorsId, publisherId, publishDate, isRecommended, categoryIds, rank } = req.body;

        try {
            const bookRepository = (await AppDataSource.getInstance()).getRepository(Books);
            const authorRepository = (await AppDataSource.getInstance()).getRepository(Authors);
            const publisherRepository = (await AppDataSource.getInstance()).getRepository(Publisher);
            const categoryRepository = (await AppDataSource.getInstance()).getRepository(Category);

            // Find the book by ID
            const book = await bookRepository.findOne({ where: { id: Number(id) }, relations: ['categories'] });

            if (!book) {
                res.status(404).json({ message: 'Book not found' });
                return;
            }

            // Ensure the provided author exists
            if (authorsId !== undefined) {
                const author = await authorRepository.findOne({ where: { id: authorsId } });
                if (!author) {
                    res.status(404).json({ message: 'Author not found' });
                    return;
                }
                book.authorsId = authorsId;
            }

            // Ensure the provided publisher exists
            if (publisherId !== undefined) {
                const publisher = await publisherRepository.findOne({ where: { id: publisherId } });
                if (!publisher) {
                    res.status(404).json({ message: 'Publisher not found' });
                    return;
                }
                book.publisherId = publisherId;
            }

            // Update the book categories
            if (categoryIds !== undefined) {
                const categories: Category[] = [];
                for (const categoryId of categoryIds) {
                    const category = await categoryRepository.findOne({ where: { id: categoryId } });
                    if (category) {
                        categories.push(category);
                    } else {
                        res.status(404).json({ message: `Category with ID ${categoryId} not found` });
                        return;
                    }
                }
                book.categories = categories;
            }

            // Update the other fields
            book.title = title !== undefined ? title : book.title;
            book.description = description !== undefined ? description : book.description;
            book.pageCount = pageCount !== undefined ? pageCount : book.pageCount;
            book.price = price !== undefined ? price : book.price;
            book.fileUrl = fileUrl !== undefined ? fileUrl : book.fileUrl;
            book.coverUrl = coverUrl !== undefined ? coverUrl : book.coverUrl;
            book.status = status !== undefined ? (status & 0xFF) : book.status;
            book.publishDate = publishDate !== undefined ? (new Date(publishDate)).toISOString().split('T')[0] : book.publishDate;
            book.isRecommended = isRecommended !== undefined ? isRecommended : book.isRecommended;
            book.rank = rank !== undefined ? rank : book.rank;

            const savedBook = await bookRepository.save(book);

            res.status(200).json({ message: 'Book updated successfully', data: savedBook });
        } catch (error: any) {
            res.status(500).json({ message: 'Failed to update book', error: error.message });
        }
    }

    async search(req: Request, res: Response): Promise<void> {
        try {
            const booksRepository = (await AppDataSource.getInstance()).getRepository(BookDetails);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);
            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, BookDetails);

            const fields = req.query.fields ? (req.query.fields as string).split(',') : null;
            let selectFields = [];
            if (fields && fields.length > 0) {
                let validFields = fields.filter(field => BookDetails.validSortColumn.includes(field.trim()));
                validFields = validFields.filter(field => field.trim() !== 'file_url');

                const invalidFields = fields.filter(field => !validFields.includes(field.trim()));
                if (invalidFields.length > 0) {
                    res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
                    return;
                }
                selectFields = validFields.map(field => `BookDetails.${field.trim()}`);
            } else {
                selectFields = BookDetails.validSortColumn
                    .filter(field => field !== 'file_url')
                    .map(field => `BookDetails.${field}`);
            }

            const queryBuilder = booksRepository.createQueryBuilder('BookDetails').select(selectFields);

            // Add dynamic search criteria
            const { title, authorName, publisherName, category, minPrice, maxPrice, exact } = req.query;

            let conditions = [];

            if (title) {
                const titleKeywords = (title as string).split(' ').map(keyword => `%${keyword.toLowerCase()}%`);
                titleKeywords.forEach((keyword, index) => {
                    conditions.push(`LOWER(BookDetails.Title) LIKE :titleKeyword${index}`);
                    queryBuilder.setParameter(`titleKeyword${index}`, keyword);
                });
            }
            if (authorName) {
                const authorKeywords = (authorName as string).split(' ').map(keyword => `%${keyword.toLowerCase()}%`);
                authorKeywords.forEach((keyword, index) => {
                    conditions.push(`LOWER(BookDetails.AuthorName) LIKE :authorKeyword${index}`);
                    queryBuilder.setParameter(`authorKeyword${index}`, keyword);
                });
            }
            if (publisherName) {
                const publisherKeywords = (publisherName as string).split(' ').map(keyword => `%${keyword.toLowerCase()}%`);
                publisherKeywords.forEach((keyword, index) => {
                    conditions.push(`LOWER(BookDetails.PublisherName) LIKE :publisherKeyword${index}`);
                    queryBuilder.setParameter(`publisherKeyword${index}`, keyword);
                });
            }
            if (category) {
                const categoryKeywords = (category as string).split(' ').map(keyword => `%${keyword.toLowerCase()}%`);
                categoryKeywords.forEach((keyword, index) => {
                    conditions.push(`LOWER(BookDetails.Categories) LIKE :categoryKeyword${index}`);
                    queryBuilder.setParameter(`categoryKeyword${index}`, keyword);
                });
            }
            if (minPrice) {
                conditions.push('BookDetails.Price >= :minPrice');
                queryBuilder.setParameter('minPrice', minPrice);
            }
            if (maxPrice) {
                conditions.push('BookDetails.Price <= :maxPrice');
                queryBuilder.setParameter('maxPrice', maxPrice);
            }

            if (conditions.length > 0) {
                if (exact === 'true') {
                    queryBuilder.where(conditions.join(' AND '));
                } else {
                    queryBuilder.where(conditions.join(' OR '));
                }
            } else {
                res.status(400).json({
                    message: "Must be atleast 1 condition given to search",
                    data: {
                        validConditions: [
                            "title",
                            "authorName",
                            "publisherName",
                            "category",
                            "minPrice",
                            "maxPrice"
                        ],
                        validSelectFields: [
                            'BookID', 'Title', 'Description', 'PageCount', 'Price',
                            'cover_url', 'status', 'PublishDate',
                            'IsRecommended', 'PublisherName', 'AuthorName',
                            'Categories', 'LikesCount'
                        ]
                    }
                });
                return;
            }

            const [books, total] = await queryBuilder
                .orderBy(`BookDetails.${sort}`, order.toUpperCase() as 'ASC' | 'DESC')
                .skip(offset)
                .take(pageSize)
                .getManyAndCount();

            if (books.length === 0) {
                res.status(404).json({ message: "No books found." });
                return;
            }

            res.status(200).json({
                message: "Books found",
                data: books,
                total,
                page,
                pageSize,
                warnings
            });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch books", error: error.message });
        }
    }

    async downloadPDF(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { id } = req.params;
            const bookRepository = (await AppDataSource.getInstance()).getRepository(Books);
            const book = await bookRepository.findOne({ where: { id: Number(id) } });
            if (!book) {
                res.status(404).json({ message: "Book not found" });
                return;
            }

            const percharged = OrdersController.IsPurcharged(req.user, book);
            if (!percharged) {
                res.status(403).json({ message: "User has yet to purcharge this book" });
                return;
            }

            const pdfCache = PDFCache.getInstance();
            const pdfPath = await pdfCache.loadAndCachePDF(book.fileUrl, book.id);
            fs.createReadStream(pdfPath).pipe(res);

        } catch (error) {
            console.error("Error while handling download request:", error);
            res.status(500).json({ message: "Server error" });
        }

    }

}

export default new BooksController;
