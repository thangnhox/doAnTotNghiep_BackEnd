import { Request, Response } from 'express';
import { getValidatedPageInfo } from '../util/checker';
import { AppDataSource } from '../models/repository/Datasource';
import { ReadHistory } from '../models/entities/ReadHistory';

class ReadHistoryController {

    async all(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const readHistoryRepository = (await AppDataSource.getInstance()).getRepository(ReadHistory);
            const [histories, total] = await readHistoryRepository.findAndCount({
                where: { userId: req.user.id },
                relations: ['books'],
                skip: offset,
                take: pageSize,
            });

            if (histories.length === 0 && total > 0) {
                res.status(400).json({ message: "Out of bound" });
                return;
            }

            const formattedResult = histories.map(history => ({
                BookID: history.booksId,
                Title: history.books.title,
                PageCount: history.books.pageCount,
                LastRead: history.lastRead,
                Progress: history.progress,
            }));

            res.status(200).json({
                message: "Success",
                data: formattedResult,
                total,
                page,
                pageSize,
            })

        } catch (error) {
            console.error("Error while get read history:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async getProgress(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { id } = req.params;
            const readHistoryRepository = (await AppDataSource.getInstance()).getRepository(ReadHistory);
            const progress = await readHistoryRepository.findOne({ where: { userId: req.user.id, booksId: Number(id) } });

            if (!progress) {
                res.status(404).json({ message: "Not read yet" });
                return;
            }

            res.status(200).json({
                message: "Success",
                data: {
                    LastRead: progress.lastRead,
                    Progress: progress.progress,
                }
            })

        } catch (error) {
            console.error("Error while get read history of book:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async removeHistory(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { id } = req.params;
            const readHistoryRepository = (await AppDataSource.getInstance()).getRepository(ReadHistory);
            const progress = await readHistoryRepository.findOne({ where: { userId: req.user.id, booksId: Number(id) } });

            if (!progress) {
                res.status(404).json({ message: "Not read yet" });
                return;
            }

            await readHistoryRepository.remove(progress);

            res.status(200).json({ message: "Success" });
            
        } catch (error) {
            console.error("Error while remove read history of book:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // async updateProgress(userId: number, booksId: number, currentPage: number): Promise<void> {
    //     try {
    //         const readHistoryRepository = (await AppDataSource.getInstance()).getRepository(ReadHistory);
    //         const progress = await readHistoryRepository.findOne({ where: { userId, booksId } });

    //         if (!progress) {
    //             const newHistory = new ReadHistory();
    //             newHistory.booksId = booksId;
    //             newHistory.userId = userId;
    //             newHistory.progress = currentPage;
    //             newHistory.lastRead = currentPage;

    //             await readHistoryRepository.save(newHistory);
    //             return;
    //         }

    //         if (progress.lastRead === currentPage) {
    //             return;
    //         }

    //         progress.lastRead = currentPage;
            
    //         if (currentPage > progress.progress) {
    //             progress.progress = currentPage;
    //         }

    //         await readHistoryRepository.save(progress);

    //     } catch (error) {
    //         console.error("Error while update read history of book:", error);
    //     }
    // }

    async updateProgress(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { id, page } = req.params;
            const booksId = Number(id);
            const currentPage = Number(page);
            const readHistoryRepository = (await AppDataSource.getInstance()).getRepository(ReadHistory);
            const progress = await readHistoryRepository.findOne({ where: { userId: req.user.id, booksId } });

            if (!progress) {
                const newHistory = new ReadHistory();
                newHistory.booksId = booksId;
                newHistory.userId = req.user.id;
                newHistory.progress = currentPage;
                newHistory.lastRead = currentPage;

                await readHistoryRepository.save(newHistory);
                res.status(201).json({ message: "New history created" });
                return;
            }

            if (progress.lastRead === currentPage) {
                res.status(204).send();
                return;
            }

            progress.lastRead = currentPage;
            
            if (currentPage > progress.progress) {
                progress.progress = currentPage;
            }

            await readHistoryRepository.save(progress);
            res.status(200).json({ message: "Update history success" });

        } catch (error) {
            console.error("Error while update read history of book:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

}

export default new ReadHistoryController;