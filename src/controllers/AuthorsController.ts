import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Authors } from '../models/entities/Authors';
import { checkReqUser, getValidatedPageInfo, sortValidator } from '../util/checker';
import { Books } from '../models/entities/Books';

class AuthorsController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const AuthorsRepository = (await AppDataSource.getInstace()).getRepository(Authors);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Authors);

            const [authors, total] = await AuthorsRepository.findAndCount({
                relations: ['books'],
                take: pageSize,
                skip: offset,
                order: {
                    [sort]: order.toUpperCase() as 'ASC' | 'DESC'
                }
            });

            const detail = req.query.detail === 'true';

            const formattedAuthors = authors.map(author => {
                if (detail) {
                    const bookCount = author.books.length;
                    const booklist = author.books.map(book => {
                        return {
                            id: book.id,
                            title: book.title,
                        };
                    });
                    const booksDisplay = bookCount > 3
                        ? [...booklist.slice(0, 3), { title: '...more', id: null }]
                        : booklist;
                    return {
                        id: author.id,
                        name: author.name,
                        birthDate: author.birthDate,
                        nation: author.nationality,
                        describe: author.description,
                        booklist: booksDisplay,
                        books: bookCount
                    };
                } else {
                    return {
                        id: author.id,
                        name: author.name,
                        birthDate: author.birthDate,
                        nation: author.nationality,
                        describe: author.description,
                        books: author.books.length
                    };
                }
            });

            res.status(200).json({
                message: "fetch success",
                data: formattedAuthors,
                total,
                page,
                pageSize,
                warnings
            });
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch categories", error: error.message });
        }
    }

    async addAuthor(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;
        try {
            const authorRepository = (await AppDataSource.getInstace()).getRepository(Authors);

            const { name, birthDate, description, nationality } = req.body;

            if (!name || !description || !birthDate) {
                res.status(400).json({ message: "Name and Description are required." });
                return;
            }

            const existAuthor = await authorRepository.findOne({ where: { name, birthDate } });
            if (existAuthor) {
                res.status(409).json({ message: "Author seems to be exists", data: existAuthor });
                return;
            }

            const newAuthor = new Authors();
            newAuthor.name = name;
            newAuthor.birthDate = (birthDate !== null) ? (new Date(birthDate)).toISOString().split('T')[0] : null;
            newAuthor.description = description;
            newAuthor.nationality = nationality || null;

            const saved = await authorRepository.save(newAuthor);

            res.status(201).json({ message: "Author added successfully", data: saved });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to add author", error: error.message });
        }
    }

    async find(req: Request, res: Response): Promise<void> {
        try {
            const authorRepository = (await AppDataSource.getInstace()).getRepository(Authors);

            // Extract query parameters
            const { name, birthYear, description, nationality } = req.query;

            // Validate that at least one parameter is provided
            if (!name && !birthYear && !description && !nationality) {
                res.status(400).json({ message: "At least one of the following query parameters must be provided: name, birthYear, description, nationality." });
                return;
            }

            const detail = req.query.detail === 'true';
            const exact = req.query.exact === 'true';

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Authors);

            // Build the query dynamically
            const queryBuilder = authorRepository.createQueryBuilder('author').leftJoinAndSelect("author.books", "book");

            let conditions = [];

            if (name) {
                const nameKeywords = (name as string).split(' ').map(keyword => `%${keyword.toLowerCase()}%`);
                nameKeywords.forEach((keyword, index) => {
                    conditions.push(`LOWER(author.name) LIKE :nameKeyword${index}`);
                    queryBuilder.setParameter(`nameKeyword${index}`, keyword);
                });
            }
            if (birthYear) {
                conditions.push('YEAR(author.birthDate) = :birthYear');
                queryBuilder.setParameter('birthYear', birthYear);
            }
            if (description) {
                const descriptionKeywords = (description as string).split(' ').map(keyword => `%${keyword.toLowerCase()}%`);
                descriptionKeywords.forEach((keyword, index) => {
                    conditions.push(`LOWER(author.description) LIKE :descriptionKeyword${index}`);
                    queryBuilder.setParameter(`descriptionKeyword${index}`, keyword);
                });
            }
            if (nationality) {
                conditions.push('LOWER(author.nationality) = LOWER(:nationality)');
                queryBuilder.setParameter('nationality', nationality);
            }

            if (conditions.length > 0) {
                if (exact) {
                    queryBuilder.where(conditions.join(' AND '));
                } else {
                    queryBuilder.where(conditions.join(' OR '));
                }
            }

            const [authors, total] = await queryBuilder.orderBy(`author.${sort}`, order.toUpperCase() as 'ASC' | 'DESC')
                .skip(offset).take(pageSize).getManyAndCount();

            if (authors.length === 0) {
                res.status(404).json({ message: "No authors found." });
                return;
            }

            const formattedAuthors = authors.map(author => {
                if (detail) {
                    const bookCount = author.books.length;
                    const booklist = author.books.map(book => {
                        return {
                            id: book.id,
                            title: book.title,
                        };
                    });
                    const booksDisplay = bookCount > 3
                        ? [...booklist.slice(0, 3), { title: '...more', id: null }]
                        : booklist;
                    return {
                        id: author.id,
                        name: author.name,
                        birthDate: author.birthDate,
                        nation: author.nationality,
                        describe: author.description,
                        booklist: booksDisplay,
                        books: bookCount
                    };
                } else {
                    return {
                        id: author.id,
                        name: author.name,
                        birthDate: author.birthDate,
                        nation: author.nationality,
                        describe: author.description,
                        books: author.books.length
                    };
                }
            });

            res.status(200).json({ message: "Authors found", data: formattedAuthors, total, page, pageSize, warnings });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch publisher(s)", error: error.message });
        }
    }

    async editAuthor(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { id } = req.params;
        const { name, birthDate, description, nationality } = req.body;

        try {
            const authorRepository = (await AppDataSource.getInstace()).getRepository(Authors);
            const author = await authorRepository.findOne({ where: { id: Number(id) } });

            if (!author) {
                res.status(404).json({ message: 'Author not found' });
                return;
            }

            // Check for duplicates before applying updates
            const duplicateAuthor = await authorRepository.findOne({
                where: [
                    { name, birthDate }
                ]
            });

            if (duplicateAuthor && duplicateAuthor.id !== author.id) {
                res.status(409).json({ message: 'Another author with the same name and birth date already exists' });
                return;
            }

            author.name = name !== undefined ? name : author.name;
            author.birthDate = birthDate !== undefined ? (new Date(birthDate)).toISOString().split('T')[0] : author.birthDate;
            author.description = description !== undefined ? description : author.description;
            author.nationality = nationality !== undefined ? nationality : author.nationality;

            await authorRepository.save(author);
            res.status(200).json({ message: 'Author updated successfully', data: author });
        } catch (error: any) {
            res.status(500).json({ message: 'Failed to update author', error: error.message });
        }
    }

    async getAuthorInfo(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        
        try {
            const authorRepository = (await AppDataSource.getInstace()).getRepository(Authors);
            const bookRepository = (await AppDataSource.getInstace()).getRepository(Books);

            const author = await authorRepository.findOne({ where: { id: Number(id) } });

            if (!author) {
                res.status(404).json({ message: 'Author not found' });
                return;
            }

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);
            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Books);

            const [books, totalBooks] = await bookRepository.findAndCount({
                where: { authors: { id: author.id } },
                take: pageSize,
                skip: offset,
                order: {
                    [sort]: order.toUpperCase() as 'ASC' | 'DESC'
                }
            });

            const formattedBooks = books.map(book => {
                return {
                    id: book.id,
                    title: book.title,
                    description: book.description,
                    pageCount: book.pageCount,
                    price: book.price,
                    cover: book.coverUrl
                }
            });

            res.status(200).json({
                message: "Author info fetched successfully",
                data: {
                    author: {
                        id: author.id,
                        name: author.name,
                        birthDate: author.birthDate,
                        nationality: author.nationality,
                        description: author.description,
                    },
                    books: {
                        list: formattedBooks,
                        totalBooks,
                        page,
                        pageSize,
                        warnings
                    },
                },
            });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch author info", error: error.message });
        }
    }
}

export default new AuthorsController;