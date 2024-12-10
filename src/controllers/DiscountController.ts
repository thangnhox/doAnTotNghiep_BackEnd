import { Request, Response } from 'express';
import { AppDataSource } from '../models/repository/Datasource';
import { Discount } from '../models/entities/Discount';
import { checkReqUser, getValidatedPageInfo, sortValidator } from '../util/checker';

class DiscountController {
    // Insert new discount
    async insertDiscount(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { name, ratio, expireDate, status } = req.body;

        try {
            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);

            // Check if a discount with the same name exists
            const existingDiscount = await discountRepository.findOne({ where: { name } });
            if (existingDiscount) {
                res.status(409).json({ message: 'Discount name already exists', data: existingDiscount });
                return;
            }

            const newDiscount = discountRepository.create({ name, ratio, expireDate: (new Date(expireDate)).toISOString().split('T')[0], status });
            const insertedDiscount = await discountRepository.save(newDiscount);

            res.status(201).json({ message: "insert success", data: insertedDiscount});
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
}

export default new DiscountController;