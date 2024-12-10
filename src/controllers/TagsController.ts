import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Tags } from '../models/entities/Tags';
import MembershipController from './MembershipController';
import { Membership } from '../models/entities/Membership';
import { TagsBooks } from '../models/entities/TagsBooks';
import { Notes } from '../models/entities/Notes';
import { Books } from '../models/entities/Books';
import { TagsNotes } from '../models/entities/TagsNotes';

class TagsController {

    async all(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const tagsRepository = (await AppDataSource.getInstance()).getRepository(Tags);

            const tags = await tagsRepository.find({ where: { userId: req.user.id } });

            res.status(200).json({ message: "Fetch success", data: tags });

        } catch (error) {
            console.error("Error while fetching tags:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async fetch(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const id = Number(req.params.id);

            const tagsRepository = (await AppDataSource.getInstance()).getRepository(Tags);
            const tag = await tagsRepository.findOne({ where: { id: id, userId: req.user.id }, relations: ['tagsBooks', 'tagsNotes'] })

            if (!tag) {
                res.status(404).json({ message: "Tags not exists" });
                return;
            }

            const formattedTagsBooks = tag.tagsBooks.map(tagbook => ({
                bookid: tagbook.booksId,
                bookpage: tagbook.page === -1 ? null : tagbook.page,
            }));

            const formattedNotes = tag.tagsNotes.map(note => ({
                id: note.id,
                noteid: note.id,
            }));

            res.status(200).json({
                message: "Fetch success",
                data: {
                    id: tag.id,
                    name: tag.name,
                    books: formattedTagsBooks,
                    notes: formattedNotes
                }
            })

        } catch (error) {
            console.error("Error while fetching tags:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async attach(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const checkMembership = await MembershipController.isValidUser(req.user);
            if (!checkMembership || !(checkMembership.rank & Membership.TAG_NOTE)) {
                res.status(403).json({
                    message: "Your account has not meet requirement to perform such action, consider register or update your membership",
                })
                return;
            }

            const { bookId, page, noteId } = req.query;
            const { id } = req.params;

            if (!bookId && !page && !noteId) {
                res.status(400).json({ message: "Invalid request", data: { note: "must contain atleast bookId or noteId", optional: "page" } });
                return;
            }

            const tagsRepository = (await AppDataSource.getInstance()).getRepository(Tags);

            const existsTag = await tagsRepository.findOne({ where: { id: Number(id), userId: req.user.id } });

            if (!existsTag) {
                res.status(404).json({ message: "Your tag id not found" });
                return;
            }

            let attachedBook: boolean = false;
            let attachedNote: boolean = false;
            const warning: string[] = [];

            if (bookId) {
                const bookPage = page ? Number(page) : -1;

                const tagsBooksRepository = (await AppDataSource.getInstance()).getRepository(TagsBooks);

                const attached = tagsBooksRepository.findOne({ where: { tagsId: existsTag.id, booksId: Number(bookId), page: bookPage } });

                if (!attached) {
                    const bookRepository = (await AppDataSource.getInstance()).getRepository(Books);
                    const existsBook = await bookRepository.findOne({ where: { id: Number(bookId) } });

                    if (existsBook) {
                        const tagsBooksRepository = (await AppDataSource.getInstance()).getRepository(TagsBooks);

                        const newAttach = new TagsBooks();
                        newAttach.booksId = Number(bookId);
                        newAttach.tagsId = Number(id);
                        newAttach.page = bookPage;

                        await tagsBooksRepository.save(newAttach);
                        attachedBook = true;
                    } else {
                        warning.push(`Book: ${bookId} not exists, skipped`);
                    }

                } else {
                    warning.push(`Book: ${bookId}/${bookPage} already attached, skipped`);
                }
            }

            if (noteId) {
                const tagsNotesRepository = (await AppDataSource.getInstance()).getRepository(TagsNotes);
                const attached = await tagsNotesRepository.findOne({ where: { tagsId: existsTag.id, notesId: Number(noteId) } });

                if (!attached) {
                    const notesRepository = (await AppDataSource.getInstance()).getRepository(Notes);
                    const existsNote = await notesRepository.findOne({ where: { id: Number(noteId), userId: req.user.id } });

                    if (existsNote) {
                        const newAttach = new TagsNotes();
                        newAttach.tagsId = existsTag.id;
                        newAttach.notesId = existsNote.id;
                        tagsNotesRepository.save(newAttach);
                        attachedNote = true;
                    } else {
                        warning.push(`Note: ${noteId} note exists, skipped`);
                    }
                } else {
                    warning.push(`Note: ${noteId} already attached to ${id}, skipped`);
                }
            }

            if (!attachedBook && !attachedNote) {
                res.status(400).json({ message: "No action performed", data: null, warning });
                return;
            }

            res.status(200).json({ message: "Attach success", data: { attachedBook, attachedNote }, warning });

        } catch (error) {
            console.error("Error while attach tag", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async detach(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }
    
        try {   
            const { bookId, page, noteId } = req.query;
            const { id } = req.params;
    
            if (!bookId && !page && !noteId) {
                res.status(400).json({ message: "Invalid request", data: { note: "must contain at least bookId or noteId", optional: "page" } });
                return;
            }
    
            const tagsRepository = (await AppDataSource.getInstance()).getRepository(Tags);
            const existsTag = await tagsRepository.findOne({ where: { id: Number(id), userId: req.user.id } });
    
            if (!existsTag) {
                res.status(404).json({ message: "Your tag id not found" });
                return;
            }
    
            let detachedBook = false;
            let detachedNote = false;
            const warning: string[] = [];
    
            if (bookId) {
                const bookPage = page ? Number(page) : -1;
                const tagsBooksRepository = (await AppDataSource.getInstance()).getRepository(TagsBooks);
                const attached = await tagsBooksRepository.findOne({ where: { tagsId: existsTag.id, booksId: Number(bookId), page: bookPage } });
    
                if (attached) {
                    await tagsBooksRepository.remove(attached);
                    detachedBook = true;
                } else {
                    warning.push(`Book: ${bookId}/${bookPage} not attached, skipped`);
                }
            }
    
            if (noteId) {
                const tagsNotesRepository = (await AppDataSource.getInstance()).getRepository(TagsNotes);
                const attached = await tagsNotesRepository.findOne({ where: { tagsId: existsTag.id, notesId: Number(noteId) } });
    
                if (attached) {
                    await tagsNotesRepository.remove(attached);
                    detachedNote = true;
                } else {
                    warning.push(`Note: ${noteId} not attached to ${id}, skipped`);
                }
            }
    
            if (!detachedBook && !detachedNote) {
                res.status(400).json({ message: "No action performed", data: null, warning });
                return;
            }
    
            res.status(200).json({ message: "Detach success", data: { detachedBook, detachedNote }, warning });
    
        } catch (error) {
            console.error("Error while detaching tag", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async add(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { name } = req.query as { name: string | null };

            if (!name) {
                res.status(400).json({ message: "Invalid request" });
                return;
            }

            const tagsRepository = (await AppDataSource.getInstance()).getRepository(Tags);
            const existsTag = await tagsRepository.findOne({ where: { name: name, userId: req.user.id } });

            if (existsTag) {
                res.status(409).json({ message: "Tags name exists", data: existsTag });
                return;
            }

            const newTag = new Tags();
            newTag.userId = req.user.id;
            newTag.name = name;
            const savedTag = await tagsRepository.save(newTag);

            res.status(201).json({ message: "Add tag success", data: savedTag });
        } catch (error) {
            console.error("Error while adding tag", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async rename(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { id } = req.params;
            const { name } = req.query as { name: string | null };

            if (!name) {
                res.status(400).json({ message: "Invalid request" });
                return;
            }

            const tagsRepository = (await AppDataSource.getInstance()).getRepository(Tags);

            const existsTag = await tagsRepository.findOne({ where: { userId: req.user.id, id: Number(id) } });

            if (!existsTag) {
                res.status(404).json({ message: "Tag ID not exists" });
                return;
            }

            const existsTagName = await tagsRepository.findOne({ where: { name: name, userId: req.user.id } });

            if (existsTagName && existsTag.id !== existsTagName.id) {
                res.status(409).json({ message: "Tags name exists", data: existsTagName });
                return;
            }

            existsTag.name = name;
            await tagsRepository.save(existsTag);
            res.status(200).json({ message: "Change name success", data: existsTag });

        } catch (error) {
            console.error("Error while rename tag", error);
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

            const tagsRepository = (await AppDataSource.getInstance()).getRepository(Tags);

            const existsTag = await tagsRepository.findOne({ where: { userId: req.user.id, id: Number(id) }, relations: ['tagsNotes', 'tagsBooks'] });

            if (!existsTag) {
                res.status(404).json({ message: "Tag ID not exists" });
                return;
            }

            const tagsBooksRepository = (await AppDataSource.getInstance()).getRepository(TagsBooks);
            const tagsNotesRepository = (await AppDataSource.getInstance()).getRepository(TagsNotes);

            await tagsBooksRepository.remove(existsTag.tagsBooks);
            await tagsNotesRepository.remove(existsTag.tagsNotes);

            await tagsRepository.remove(existsTag);
            res.status(200).json({ message: "Remove tag success"});

        } catch (error) {
            console.error("Error while remove tag", error);
            res.status(500).json({ message: "Server error" });
        }
    }

}

export default new TagsController;