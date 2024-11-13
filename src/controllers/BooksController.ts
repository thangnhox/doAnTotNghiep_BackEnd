import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Books } from '../models/entities/Books';
import { Publisher } from '../models/entities/Publisher';
import { checkReqUser, getValidatedPageInfo, sortValidator } from '../util/checker';
import { Authors } from '../models/entities/Authors';
import { BookDetails } from '../models/views/BookDetails';
import { Category } from '../models/entities/Category';

class BooksController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const booksRepository = (await AppDataSource.getInstace()).getRepository(BookDetails);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);
            const fields = req.query.fields ? (req.query.fields as string).split(',') : null;

            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, BookDetails);

            // Validate requested fields
            let selectFields = ['BookDetails'];
            if (fields && fields.length > 0) {
                const invalidFields = fields.filter(field => !BookDetails.validSortColumn.includes(field.trim()));
                if (invalidFields.length > 0) {
                    res.status(400).json({ message: `Invalid fields: ${invalidFields.join(', ')}` });
                    return;
                }
                selectFields = fields.map(field => `BookDetails.${field.trim()}`);
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

}

export default new BooksController;