import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { User } from '../models/entities/User';
import { makeAuthenticationToken } from '../services/authentication';
import { checkReqUser, getValidatedPageInfo, orderChecker, sortValidator } from '../util/checker';
import { Orders } from '../models/entities/Orders';
import { Bill } from '../models/entities/Bill';
import { Books } from '../models/entities/Books';
import { BookDetails } from '../models/views/BookDetails';
import { MembershipRecord } from '../models/entities/MembershipRecord';
import { Membership } from '../models/entities/Membership';
import { Subscribe } from '../models/entities/Subscribe';
import { BookRequest } from '../models/entities/BookRequest';
import { sendMail } from '../services/email';

class AdminController {
    async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        try {
            const userRepository = (await AppDataSource.getInstance()).getRepository(User);
            const userData = await userRepository.findOne({ where: { email } });
            if (!userData) {
                res.status(401).json({ message: "access denied" });
                return;
            }
            if (userData.password !== password || !userData.isAdmin) {
                res.status(401).json({ message: "Access denied" });
            } else {
                const token = makeAuthenticationToken(userData.id, userData.email);
                res.status(200).json({ message: "authentication confirmed", data: token });
            }
        } catch (error: any) {
            console.error("Error while admin login:", error);
            res.status(500).json({ message: "Authentication server error" });
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        if (
            !req.body.currentPassword ||
            !req.body.newPassword
        ) {
            res.status(400).json({ message: "invalid request" });
            return;
        }

        if (req.body.currentPassword !== req.user!.password) {
            res.status(403).json({ message: "wrong password" });
            return;
        }

        try {
            const userRepository = (await AppDataSource.getInstance()).getRepository(User);

            req.user!.password = req.body.newPassword;

            const savedChanged = await userRepository.save(req.user!);

            const newToken = makeAuthenticationToken(savedChanged.id, savedChanged.email);

            res.status(200).json({ message: "change password success", data: { savedChanged, newToken } });
        } catch (error: any) {
            console.error("Error while changing admin password:", error);
            res.status(500).json({ message: "Database server error", error });
        }
    }

    async soldBooks(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        try {
            const ordersRepository = (await AppDataSource.getInstance()).getRepository(Orders);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const order = req.query.order && orderChecker((req.query.order as string).toUpperCase()) ? (req.query.order as string).toUpperCase() : "ASC";
            const days = req.query.days ? parseInt(req.query.days as string, 10) : null;

            // Ensure days is a positive number
            if (days !== null && days <= 0) {
                res.status(400).json({ message: "days must be a positive number" });
                return;
            }

            const query = ordersRepository.createQueryBuilder("orders")
                .innerJoin(Bill, "bill", "orders.billId = bill.id")
                .innerJoin(Books, "book", "orders.booksId = book.ID")
                .select([
                    "book.ID AS BookID",
                    "book.Title AS Title",
                    "book.Price AS Price",
                    "book.cover_url AS cover_url",
                    "book.PageCount AS PageCount",
                    "COUNT(orders.booksId) AS SoldCount"
                ])
                .where("bill.transId IS NOT NULL")
                .groupBy("book.ID")
                .orderBy("SoldCount", order as "ASC" | "DESC");

            // Apply the date filter if days is set
            if (days !== null) {
                const currentDate = new Date();
                const pastDate = new Date();
                pastDate.setDate(currentDate.getDate() - days);

                query.andWhere("bill.paymentDate >= :pastDate", { pastDate: pastDate.toISOString().split('T')[0] });
            }

            const soldBookDetails = await query.getRawMany();

            const soldBookCount = await query.getCount();

            const totalSum = soldBookDetails.reduce((sum, record) => {
                return sum + (parseFloat(record.Price) * parseInt(record.SoldCount));
            }, 0);

            const formattedList = soldBookDetails.slice(offset, offset + pageSize).map(record => ({
                BookID: parseInt(record.BookID),
                Title: record.Title,
                Price: parseFloat(record.Price),
                cover_url: record.cover_url,
                PageCount: parseInt(record.PageCount),
                SoldCount: parseInt(record.SoldCount)
            }));

            res.status(200).json({
                message: "Success",
                data: {
                    list: formattedList,
                    total: soldBookCount,
                    totalSum,
                },
                total: soldBookDetails.length,
                page,
                pageSize
            });

        } catch (error) {
            console.error("Error while fetching sold books:", error);
            res.status(500).json({ message: "Database server error", error });
        }
    }


    async bookStatistic(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        try {
            const booksRepository = (await AppDataSource.getInstance()).getRepository(BookDetails);

            const [
                highestPrice,
                lowestPrice,
                highestPageCount,
                lowestPageCount,
                highestLikeCount,
                lowestLikeCount
            ] = await Promise.all([
                booksRepository.createQueryBuilder("book")
                    .orderBy("book.Price", "DESC")
                    .getOne(),
                booksRepository.createQueryBuilder("book")
                    .orderBy("book.Price", "ASC")
                    .getOne(),
                booksRepository.createQueryBuilder("book")
                    .orderBy("book.PageCount", "DESC")
                    .getOne(),
                booksRepository.createQueryBuilder("book")
                    .orderBy("book.PageCount", "ASC")
                    .getOne(),
                booksRepository.createQueryBuilder("book")
                    .orderBy("book.LikesCount", "DESC")
                    .getOne(),
                booksRepository.createQueryBuilder("book")
                    .orderBy("book.LikesCount", "ASC")
                    .getOne()
            ]);

            res.status(200).json({
                message: "Success",
                data: {
                    highestPrice,
                    lowestPrice,
                    highestPageCount,
                    lowestPageCount,
                    highestLikeCount,
                    lowestLikeCount,
                }
            })

        } catch (error) {
            console.error("Error while making book statistic:", error);
            res.status(500).json({ message: "Database server error", error });
        }
    }

    async membershipStatistic(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        try {
            const membershipRecordRepository = (await AppDataSource.getInstance()).getRepository(MembershipRecord);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);
            const order = req.query.order && orderChecker((req.query.order as string).toUpperCase()) ? (req.query.order as string).toUpperCase() : "ASC";

            const mainQuery = membershipRecordRepository.createQueryBuilder("mr")
                .innerJoin(Membership, "m", "mr.membershipId = m.id")
                .select([
                    "mr.membershipId AS MembershipID",
                    "m.name AS Name",
                    "m.price AS Price",
                    "COUNT(*) AS TotalRecords",
                    "SUM(CASE WHEN mr.token IS NULL THEN 1 ELSE 0 END) AS CanceledRecords",
                    "m.price * (COUNT(*) - SUM(CASE WHEN mr.token IS NULL THEN 1 ELSE 0 END)) AS PredictedIncome"
                ])
                .groupBy("mr.membershipId, m.name, m.price")
                .orderBy("TotalRecords", order as "ASC" | "DESC");

            const membershipUserCount = await mainQuery.getRawMany();

            const totalSumPredictedIncome = membershipUserCount.reduce((sum, record) => {
                return sum + parseFloat(record.PredictedIncome)
            }, 0);

            const formattedMembershipsUserCount = membershipUserCount.slice(offset, offset + pageSize).map(record => ({
                MembershipID: parseInt(record.MembershipID, 10),
                Name: record.Name,
                Price: parseFloat(record.Price),
                TotalRecords: parseInt(record.TotalRecords, 10),
                CanceledRecords: parseInt(record.CanceledRecords, 10),
                PredictedIncome: parseFloat(record.PredictedIncome),
            }));

            res.status(200).json({
                message: "Success",
                data: {
                    list: formattedMembershipsUserCount,
                    predictedIncome: totalSumPredictedIncome,
                },
                total: membershipUserCount.length,
                page,
                pageSize,
            });
        } catch (error) {
            console.error("Error while making membership statistic:", error);
            res.status(500).json({ message: "Database server error", error });
        }
    }

    async membershipIncome(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        try {
            const subscribeRepository = (await AppDataSource.getInstance()).getRepository(Subscribe);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const order = req.query.order && orderChecker((req.query.order as string).toUpperCase()) ? (req.query.order as string).toUpperCase() : "ASC";
            const days = req.query.days ? parseInt(req.query.days as string, 10) : null;

            // Ensure days is a positive number
            if (days !== null && days <= 0) {
                res.status(400).json({ message: "days must be a positive number" });
                return;
            }

            const query = subscribeRepository.createQueryBuilder("subscribe")
                .innerJoin("subscribe.membership", "membership")
                .select([
                    "membership.ID AS MembershipID",
                    "membership.Name AS MembershipName",
                    "membership.Price AS Price",
                    "COUNT(subscribe.ID) AS SubscribeCount",
                    "SUM(subscribe.totalPrice) AS TotalIncome"
                ])
                .groupBy("membership.ID")
                .orderBy("TotalIncome", order as "ASC" | "DESC");

            // Apply the date filter if days is set
            if (days !== null) {
                const currentDate = new Date();
                const pastDate = new Date();
                pastDate.setDate(currentDate.getDate() - days);

                query.andWhere("subscribe.date >= :pastDate", { pastDate: pastDate.toISOString().split('T')[0] });
            }

            const membershipIncomeDetails = await query.getRawMany();

            const membershipIncomeCount = await query.getCount();

            const totalSum = membershipIncomeDetails.reduce((sum, record) => {
                return sum + parseFloat(record.TotalIncome);
            }, 0);

            const formattedList = membershipIncomeDetails.slice(offset, offset + pageSize).map(record => ({
                MembershipID: parseInt(record.MembershipID, 10),
                MembershipName: record.MembershipName,
                Price: parseFloat(record.Price),
                SubscribeCount: parseInt(record.SubscribeCount, 10),
                TotalIncome: parseFloat(record.TotalIncome)
            }));

            res.status(200).json({
                message: "Success",
                data: {
                    list: formattedList,
                    total: membershipIncomeCount,
                    totalSum,
                },
                total: membershipIncomeDetails.length,
                page,
                pageSize
            });

        } catch (error) {
            console.error("Error while making membership income:", error);
            res.status(500).json({ message: "Database server error", error });
        }
    }

    async getUserAgeGroupStatistics(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        try {
            const entityManager = (await AppDataSource.getInstance()).manager;

            const sqlQuery = `
                SELECT
                    AllAgeGroups.AgeGroup,
                    COALESCE(UserCount, 0) AS UserCount
                FROM
                    (
                        SELECT 'NONE' AS AgeGroup
                        UNION ALL
                        SELECT '< 6' AS AgeGroup
                        UNION ALL
                        SELECT '6 - 11' AS AgeGroup
                        UNION ALL
                        SELECT '11 - 18' AS AgeGroup
                        UNION ALL
                        SELECT '> 18' AS AgeGroup
                    ) AS AllAgeGroups
                LEFT JOIN
                    (
                        SELECT
                            CASE
                                WHEN BirthYear IS NULL THEN 'NONE' 
                                WHEN YEAR(CURRENT_DATE) - BirthYear < 6 THEN '< 6'
                                WHEN YEAR(CURRENT_DATE) - BirthYear BETWEEN 6 AND 11 THEN '6 - 11'
                                WHEN YEAR(CURRENT_DATE) - BirthYear BETWEEN 12 AND 18 THEN '11 - 18'
                                ELSE '> 18'
                            END AS AgeGroup,
                            COUNT(*) AS UserCount
                        FROM
                            test_DoAnTotNghiep.User
                        GROUP BY
                            AgeGroup
                    ) AS UserCounts ON AllAgeGroups.AgeGroup = UserCounts.AgeGroup
                UNION ALL
                SELECT
                    'Total',
                    (SELECT COUNT(*) FROM test_DoAnTotNghiep.User);
            `;

            const ageGroupStatistics = await entityManager.query(sqlQuery);

            const formattedAgeGroupStatistics = ageGroupStatistics.map((record: { AgeGroup: any; UserCount: string; }) => ({
                AgeGroup: record.AgeGroup,
                UserCount: parseInt(record.UserCount, 10),
            }));

            res.status(200).json({
                message: "Success",
                data: formattedAgeGroupStatistics,
            });
        } catch (error) {
            console.error("Error while getting user age group statistics:", error);
            res.status(500).json({ message: "Database server error", error });
        }
    }

    async requestedBooks(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        try {
            const dataSource = await AppDataSource.getInstance();
            const bookrequestRepository = dataSource.getRepository(BookRequest);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const [list, total] = await bookrequestRepository.findAndCount({ take: pageSize, skip: offset });

            res.status(200).json({
                message: "Success",
                data: list,
                total,
                page,
                pageSize
            });
        } catch (error) {
            console.error("Error while getting user request books list:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async searchRequest(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        try {
            const { title, description } = req.query;

            // Validate that at least one parameter is provided
            if (!title && !description) {
                res.status(400).json({ message: "At least one of the following query parameters must be provided: title, description." });
                return;
            }

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, BookRequest);

            const dataSource = await AppDataSource.getInstance();
            const bookRequestRepository = dataSource.getRepository(BookRequest);

            // Build the query dynamically
            const queryBuilder = bookRequestRepository.createQueryBuilder('bookRequest');

            let conditions: string[] = [];

            if (title) {
                const titleKeywords = (title as string).split(' ').map(keyword => `%${keyword.toLowerCase()}%`);
                titleKeywords.forEach((keyword, index) => {
                    conditions.push(`LOWER(bookRequest.title) LIKE :titleKeyword${index}`);
                    queryBuilder.setParameter(`titleKeyword${index}`, keyword);
                });
            }

            if (description) {
                const descriptionKeywords = (description as string).split(' ').map(keyword => `%${keyword.toLowerCase()}%`);
                descriptionKeywords.forEach((keyword, index) => {
                    conditions.push(`LOWER(bookRequest.description) LIKE :descriptionKeyword${index}`);
                    queryBuilder.setParameter(`descriptionKeyword${index}`, keyword);
                });
            }

            if (conditions.length > 0) {
                queryBuilder.where(conditions.join(' OR '));
            }

            const [bookRequests, total] = await queryBuilder.orderBy(`bookRequest.${sort}`, order.toUpperCase() as 'ASC' | 'DESC')
                .skip(offset).take(pageSize).getManyAndCount();

            if (bookRequests.length === 0 && total > 0) {
                res.status(404).json({ message: "No book requests found." });
                return;
            }

            res.status(200).json({
                message: "Book requests found",
                data: bookRequests,
                total,
                page,
                pageSize,
                warnings
            });
        } catch (error: any) {
            console.error("Error while searching book requests:", error);
            res.status(500).json({ message: "Failed to fetch book request(s)", error: error.message });
        }
    }

    async confirmBookrequest(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        try {
            const { id } = req.params;
            const { bookId } = req.query;

            if (!bookId) {
                res.status(400).json({ message: "Must specify bookId, -1 for reject request" });
            }

            const dataSource = await AppDataSource.getInstance();
            const bookRequestRepository = dataSource.getRepository(BookRequest);

            const request = await bookRequestRepository.findOne({ where: { id: Number(id) }, relations: ['user'] });

            if (!request) {
                res.status(404).json({ message: "Book request not found" });
                return;
            }

            if (bookId === "-1") {
                sendMail(request.user.email, `Your book request ${request.title} has been rejected`, "Book request notification");
            } else {
                const bookRepository = dataSource.getRepository(Books);
                const book = await bookRepository.findOne({ where: { id: Number(bookId) } });

                if (!book) {
                    res.status(404).json({ message: "Book not found" });
                    return;
                }

                sendMail(request.user.email, `Your book request ${request.title} has been conpleted and available as ${book.title}`, "Book request notification");
            }

            await bookRequestRepository.remove(request);
            res.status(200).json({ message: "Confirm success" });

        } catch (error: any) {
            console.error("Error while confirm book request:", error);
            res.status(500).json({ message: "Failed to fetch book request(s)", error: error.message });
        }
    }

}

export default new AdminController;