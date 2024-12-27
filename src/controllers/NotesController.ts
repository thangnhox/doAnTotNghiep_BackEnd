import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Notes } from '../models/entities/Notes';
import { getValidatedPageInfo } from '../util/checker';
import { Books } from '../models/entities/Books';
import MembershipController from './MembershipController';
import { Membership } from '../models/entities/Membership';
import { TagsNotes } from '../models/entities/TagsNotes';

class NotesController {

    async all(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }
        try {
            const notesRepository = (await AppDataSource.getInstance()).getRepository(Notes);
            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const [notes, total] = await notesRepository.findAndCount({
                where: { userId: req.user.id },
                take: pageSize,
                skip: offset
            })

            if (notes.length === 0 && total > 0) {
                res.status(416).json({ message: "Out of bound" });
                return;
            }

            res.status(200).json({ message: "Success", data: notes, total, page, pageSize });

        } catch (error) {
            console.log("Error while fetch Notes list:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async fetch(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { id } = req.params;
            const notesRepository = (await AppDataSource.getInstance()).getRepository(Notes);
            const note = await notesRepository.findOne({ where: { id: Number(id), userId: req.user.id } });

            if (!note) {
                res.status(404).json({ message: "Note id not exists" });
                return;
            }

            res.status(200).json({ message: "Success", data: note });

        } catch (error) {
            console.log("Error while fetch Notes:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async search(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const notesRepository = (await AppDataSource.getInstance()).getRepository(Notes);

            // Extract query parameters
            const { booksId, booksPage, detail } = req.query;

            // Validate that at least one parameter is provided
            if (!booksId && !booksPage && !detail) {
                res.status(400).json({ message: "At least one of the following query parameters must be provided: booksId, page, detail." });
                return;
            }

            const detailFlag = req.query.detail === 'true';
            const exact = req.query.exact === 'true';

            const { page: pageNumber, pageSize, offset } = getValidatedPageInfo(req.query);

            // Build the query dynamically
            const queryBuilder = notesRepository.createQueryBuilder('note')
                .leftJoinAndSelect('note.books', 'book')
                .leftJoinAndSelect('note.user', 'user')
                .where('note.userId = :userId', { userId: req.user.id });

            let conditions = [];

            if (booksId) {
                conditions.push('note.booksId = :booksId');
                queryBuilder.setParameter('booksId', booksId);
            }
            if (booksPage) {
                conditions.push('note.page = :page');
                queryBuilder.setParameter('page', booksPage);
            }
            if (detail) {
                const detailKeywords = (detail as string).split(' ').map(keyword => `%${keyword.toLowerCase()}%`);
                detailKeywords.forEach((keyword, index) => {
                    conditions.push(`LOWER(note.detail) LIKE :detailKeyword${index}`);
                    queryBuilder.setParameter(`detailKeyword${index}`, keyword);
                });
            }

            if (conditions.length > 0) {
                const joinedConditions = conditions.join(exact ? ' AND ' : ' OR ');
                queryBuilder.andWhere(`(${joinedConditions})`);
            }

            const [notes, total] = await queryBuilder
                .skip(offset).take(pageSize).getManyAndCount();

            if (notes.length === 0) {
                res.status(404).json({ message: "No notes found." });
                return;
            }

            const formattedNotes = notes.map(note => {
                if (detailFlag) {
                    return {
                        id: note.id,
                        userId: note.userId,
                        booksId: note.booksId,
                        page: note.page === -1 ? null : note.page,
                        detail: note.detail,
                        bookTitle: note.books.title,
                        userName: note.user.name
                    };
                } else {
                    return {
                        id: note.id,
                        userId: note.userId,
                        booksId: note.booksId,
                        page: note.page === -1 ? null : note.page,
                        detail: note.detail
                    };
                }
            });

            res.status(200).json({ message: "Notes found", data: formattedNotes, total, page: pageNumber, pageSize });
        } catch (error) {
            console.log("Error while search:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async add(req: Request, res: Response) {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const allowed = await MembershipController.isValidUser(req.user);

            if (!allowed || !(allowed.rank & Membership.TAG_NOTE)) {
                res.status(403).json({ message: "Your account doesn't have permission to do so" });
                return;
            }

            const { booksId, page, detail } = req.body;

            // Validate the required parameters
            if (!booksId) {
                res.status(400).json({ message: "Books ID is required" });
                return;
            }

            // Default page to -1 if not provided
            const pageNumber = page !== undefined && page !== null ? page : -1;

            // Find the book
            const bookRepository = (await AppDataSource.getInstance()).getRepository(Books);
            const book = await bookRepository.findOne({ where: { id: booksId } });

            if (!book) {
                res.status(404).json({ message: "Book not found" });
                return;
            }

            // Create the new note
            const notesRepository = (await AppDataSource.getInstance()).getRepository(Notes);

            const existsNote = await notesRepository.findOne({ where: { booksId: book.id, page: pageNumber, userId: req.user.id } });

            if (existsNote) {
                res.status(409).json({ message: "Note exists", data: existsNote });
                return;
            }

            const newNote = new Notes();
            newNote.userId = req.user.id;
            newNote.booksId = booksId;
            newNote.page = pageNumber;
            newNote.detail = detail || null;

            // Save the new note
            await notesRepository.save(newNote);

            res.status(201).json({ message: "Note added successfully", data: newNote });
            return;

        } catch (error) {
            console.log("Error while adding note:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async edit(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const allowed = await MembershipController.isValidUser(req.user);

            if (!allowed || !(allowed.rank & Membership.TAG_NOTE)) {
                res.status(403).json({ message: "Your account doesn't have permission to do so" });
                return;
            }

            const { booksId, page, detail } = req.body;
            const { id } = req.params;

            // Validate the required parameters
            if (!booksId && !detail) {
                res.status(400).json({ message: "At least provie detail or bookId is required" });
                return;
            }

            // Default page to -1 if not provided
            const pageNumber = page !== undefined && page !== null ? page : -1;

            const notesRepository = (await AppDataSource.getInstance()).getRepository(Notes);
            const existsNote = await notesRepository.findOne({ where: { id: Number(id), userId: req.user.id } });

            if (!existsNote) {
                res.status(404).json({ message: "Note not exists" });
                return;
            }

            let oldDetail: string | null = null;
            let oldPosision: { bookId: number, page: number | null } | null = null;
            const warning: string[] = [];

            if (detail) {
                oldDetail = existsNote.detail;
                existsNote.detail = detail;
            }

            if (booksId) {
                const bookRepository = (await AppDataSource.getInstance()).getRepository(Books);
                const book = await bookRepository.findOne({ where: { id: booksId } });

                if (book) {
                    const targetPosition = await notesRepository.findOne({ where: { booksId: booksId, page: pageNumber, userId: req.user.id } });

                    if (!targetPosition) {
                        oldPosision = {
                            bookId: existsNote.booksId,
                            page: existsNote.page === -1 ? null : existsNote.page,
                        }

                        existsNote.booksId = booksId;
                        existsNote.page = pageNumber;
                    } else {
                        if (!oldDetail) {
                            if (targetPosition.id === existsNote.id) {
                                res.status(400).json({ message: "Move request to same position, skipped" });
                                return;
                            }

                            res.status(409).json({ message: `Target position exists with note id ${targetPosition.id}` })
                            return;
                        } else {
                            if (targetPosition.id === existsNote.id) {
                                warning.push("Move request to same position, skipped");
                            } else {
                                warning.push(`Failed to move, target position exists with note id ${targetPosition.id}`);
                            }

                        }
                    }
                } else {
                    if (!oldDetail) {
                        res.status(404).json({ message: "Unable to move, book it exists" });
                        return;
                    } else {
                        warning.push("Book not exists, skip moving");
                    }
                }

            }

            await notesRepository.save(existsNote);
            res.status(200).json({
                message: "edit success",
                data: {
                    note: existsNote,
                    oldDetail,
                    oldPosision
                },
                warning
            })

        } catch (error) {
            console.log("Error while edting note:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async remove(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { id } = req.params;
            const notesRepository = (await AppDataSource.getInstance()).getRepository(Notes);
            const existsNote = await notesRepository.findOne({ where: { id: Number(id), userId: req.user.id }, relations: ['tagsNotes'] });

            if (!existsNote) {
                res.status(404).json({ message: "Note not exists" });
                return;
            }

            const tagsNotesRepository = (await AppDataSource.getInstance()).getRepository(TagsNotes);
            
            await tagsNotesRepository.remove(existsNote.tagsNotes);
            await notesRepository.remove(existsNote);

            res.status(200).json({ message: "Remove note success" });

        } catch (error) {
            console.log("Error while removing note:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

}

export default new NotesController;