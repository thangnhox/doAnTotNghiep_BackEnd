import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Authors } from '../models/entities/Authors';
import { checkReqUser, sortValidator } from '../util/checker';
import { describe } from 'node:test';

class AuthorsController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const AuthorsRepository = (await AppDataSource.getInstace()).getRepository(Authors);

            const page = parseInt(req.query.page as string, 10) || 1;
            const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
            const offset = (page - 1) * pageSize;

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
                    const booksDisplay = bookCount > 3
                        ? [...author.books.slice(0, 3), { title: '...more', id: null }]
                        : author.books;
                    return {
                        id: author.id,
                        name: author.name,
                        describe: author.description,
                        booklist: booksDisplay,
                        books: bookCount
                    };
                } else {
                    return {
                        id: author.id,
                        name: author.name,
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
    
            if (!name || !description) {
                res.status(400).json({ message: "Name and Description are required." });
                return;
            }
    
            const newAuthor = new Authors();
            newAuthor.name = name;
            newAuthor.birthDate = (birthDate !== null) ? (new Date(birthDate)).toISOString().split('T')[0] : null;
            newAuthor.description = description;
            newAuthor.nationality = nationality || null;
    
            const saved = await authorRepository.save(newAuthor);
    
            res.status(201).json({ message: "Author added successfully", author: saved });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to add author", error: error.message });
        }
    }
}

export default new AuthorsController;