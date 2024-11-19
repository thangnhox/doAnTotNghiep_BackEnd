import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Books } from '../models/entities/Books';
import { Publisher } from '../models/entities/Publisher';
import { checkReqUser, getValidateBookPage, getValidatedPageInfo, sortValidator } from '../util/checker';
import { Authors } from '../models/entities/Authors';
import { BookDetails } from '../models/views/BookDetails';
import { Category } from '../models/entities/Category';
import { validateTokenJWT } from '../services/authentication';
import PDFCache from '../services/pdfcacher';
import { convertPdfPageToImage } from '../util/pdf2img';
import fs from 'fs';
import MembershipController from './MembershipController';
import OrderaController from './OrdersController';

class BooksController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const booksRepository = (await AppDataSource.getInstace()).getRepository(BookDetails);

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
            const bookRepository = (await AppDataSource.getInstace()).getRepository(Books);
            const authorRepository = (await AppDataSource.getInstace()).getRepository(Authors);
            const publisherRepository = (await AppDataSource.getInstace()).getRepository(Publisher);
            const categoryRepository = (await AppDataSource.getInstace()).getRepository(Category);

            const { title, description, pageCount, price, fileUrl, coverUrl, status, authorsId, publisherId, publishDate, isRecommended, categoryIds } = req.body;

            // Validate required fields
            if (!title || !description || !pageCount || !price || !fileUrl || !authorsId || !publisherId || !publishDate || !categoryIds) {
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

            const savedBook = await bookRepository.save(newBook);

            res.status(201).json({ message: "Book added successfully", data: savedBook });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to add book", error: error.message });
        }
    }

    async fetch(req: Request, res: Response): Promise<void> {
        try {
            const booksRepository = (await AppDataSource.getInstace()).getRepository(BookDetails);

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
            const bookRepository = (await AppDataSource.getInstace()).getRepository(Books);
            const book = await bookRepository.findOne({ where: { id: Number(id) } });

            if (!book) {
                res.status(404).json({ message: 'Book not found' });
                return;
            }

            const isMemberShip = await MembershipController.isValidUser(req.user);
            const isPurcharged = await OrderaController.IsPurcharged(req.user, book);

            if (!isMemberShip && !isPurcharged) {
                res.status(403).json({ message: `${req.user.name} is not a membership nor purcharged the book.` });
            }

            if (page > book.pageCount) {
                res.status(400).json({ message: "Out of bound" });
                return;
            }

            const pdfCache = PDFCache.getInstance();
            const pdfPath = await pdfCache.loadAndCachePDF(book.fileUrl, book.id);

            const image = await convertPdfPageToImage(pdfPath, page, `${PDFCache.getCacheDir()}/${id}.d/`, { width, height, density });

            if (image === null) {
                res.status(500).json({ message: "Failed to read book" });
                return;
            }

            if (image.path === null) {
                res.status(500).json({ message: "Failed to prepare page" });
                return;
            }

            res.setHeader('Content-Type', 'image/png');

            fs.createReadStream(image.path as string).pipe(res);

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Error reading PDF file', error: error.message });
        }
    }

}

export default new BooksController;