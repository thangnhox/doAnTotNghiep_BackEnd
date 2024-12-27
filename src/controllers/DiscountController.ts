import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Discount } from '../models/entities/Discount';
import { checkReqUser, generateRandomString, getValidatedPageInfo, sortValidator } from '../util/checker';
import Logger from '../util/logger';

class DiscountController {
    // Insert new discount
    async insertDiscount(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;
    
        const { name, ratio, expireDate, status } = req.body;
    
        if (!ratio || !expireDate) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }
    
        try {
            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);
            let newName: string = name || "";
    
            if (name) {
                // Check if a discount with the same name exists
                const existingDiscount = await discountRepository.findOne({ where: { name } });
                if (existingDiscount) {
                    res.status(409).json({ message: 'Discount name already exists', data: existingDiscount });
                    return;
                }
            } else {
                // Generate a unique name if not provided
                do {
                    newName = generateRandomString();
                } while (await discountRepository.findOne({ where: { name: newName } }));
            }
    
            const newDiscount = discountRepository.create({
                name: newName,
                ratio,
                expireDate: new Date(expireDate).toISOString().split('T')[0],
                status: status || 1
            });
    
            const insertedDiscount = await discountRepository.save(newDiscount);
    
            res.status(201).json({ message: "Insert success", data: insertedDiscount });
        } catch (error) {
            console.error('Error inserting discount:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
    

    // Edit an existing discount
    async editDiscount(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { id } = req.params;
        const { ratio, expireDate, status } = req.body;

        try {
            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);
            const discount = await discountRepository.findOne({ where: { id: Number(id) } });

            if (!discount) {
                res.status(404).json({ message: 'Discount not found' });
                return;
            }

            discount.ratio = ratio !== undefined ? ratio : discount.ratio;
            discount.expireDate = (new Date(expireDate)).toISOString().split('T')[0] || discount.expireDate;
            discount.status = status !== undefined ? status : discount.status;

            const updatedDiscount = await discountRepository.save(discount);
            res.status(200).json({ message: "Update success", data: updatedDiscount });
        } catch (error) {
            console.error('Error editing discount:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Hide a discount (soft delete)
    async hideDiscount(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;
        const { id } = req.params;

        try {
            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);
            const discount = await discountRepository.findOne({ where: { id: Number(id) } });

            if (!discount) {
                res.status(404).json({ message: 'Discount not found' });
                return;
            }

            discount.status = 0; // Assuming 0 means hidden/inactive
            await discountRepository.save(discount);

            res.status(200).json({ message: 'Discount hidden successfully' });
        } catch (error) {
            console.error('Error hiding discount:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async all(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;
        try {
            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);
            const { page, pageSize, offset } = getValidatedPageInfo(req.query);
            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Discount);

            const [discounts, total] = await discountRepository.findAndCount({
                take: pageSize,
                skip: offset,
                order: {
                    [sort]: order.toUpperCase() as 'ASC' | 'DESC'
                }
            });

            res.status(200).json({
                message: "fetch success",
                data: discounts,
                total,
                page,
                pageSize,
                warnings
            });
        } catch (error) {
            console.error('Error hiding discount:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async search(req: Request, res: Response): Promise<void> {
        try {
            const { name } = req.query;
            if (!name) {
                res.status(400).json({ message: "Invalid request" });
                return;
            }

            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);
            const { page, pageSize, offset } = getValidatedPageInfo(req.query);
            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Discount);

            const qb = discountRepository.createQueryBuilder("discount")
                .where("discount.name like :name", { name: `%${name}%` })
                .orderBy(`discount.${sort}`, order)
                .skip(offset).take(pageSize);

            const [discounts, total] = await qb.getManyAndCount();

            if (discounts.length === 0 && total > 0) {
                res.status(416).json({ message: "Out of bound" });
                return;
            }

            if (total === 0) {
                res.status(404).json({ message: "Not found" });
                return;
            }

            res.status(200).json({
                message: "Success",
                data: discounts,
                total,
                page,
                pageSize,
                warnings,
            })

        } catch (error) {
            console.error('Error searching discount:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async fetch(req: Request, res: Response) {
        try {
            const { name } = req.params;

            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);

            const discount = await discountRepository.find({ where: { name } });

            if (!discount) {
                res.status(404).json({ message: "Not found" });
                return;
            }

            res.status(200).json({
                message: "Success",
                data: discount,
            })

        } catch (error) {
            console.error('Error fetch discount:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async dailyExpireCheck(): Promise<void> {
        const logger = Logger.getInstance();
        try {
            logger.info("Start daily discount check");
            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);
            const toDay = (new Date()).toISOString().split('T')[0];

            // const result = await discountRepository.createQueryBuilder()
            //     .update(Discount)
            //     .set({ status: 0 })
            //     .where("expireDate = :today", { today: toDay })
            //     .execute();

            const result = await discountRepository.update(
                { expireDate: toDay },
                { status: 0 }
            );

            if (!result.affected) {
                logger.error("Error while updating discount:", result.raw);
                return;
            }

            logger.warn(`Update success ${result.affected} discount(s) expired`);

        } catch (error) {
            logger.error("Error while check expired discount", error);
            console.error("Error while check expired discount", error);
        }
    }
}

export default new DiscountController;