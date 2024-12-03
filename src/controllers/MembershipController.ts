import { Request, Response } from 'express';
import { User } from '../models/entities/User';
import { AppDataSource } from '../models/repository/Datasource';
import { MembershipRecord } from '../models/entities/MembershipRecord';
import { checkReqUser, getValidatedPageInfo, sortValidator } from '../util/checker';
import { Membership } from '../models/entities/Membership';

class MembershipController {
    async isValidUser(user: User): Promise<boolean> {
        try {
            const membershipRepository = (await AppDataSource.getInstace()).getRepository(MembershipRecord);
            const existRecord = await membershipRepository.findOne({ where: { userId: user.id } });
            if (existRecord) return true;
        } catch (error) {
            console.error(`Error validating: ${error}`);
        }

        return false;
    }

    async checkMembership(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Failed to validate authenticated user" });
                return;
            }

            const membershipRecordRepository = (await AppDataSource.getInstace()).getRepository(MembershipRecord);
            const membershipData = await membershipRecordRepository.findOne({ where: { userId: req.user.id }, relations: ['membership'] });

            if (!membershipData) {
                res.status(404).json({ message: `${req.user.name} don't have membership` });
                return;
            }

            res.status(200).json({ message: `${req.user.name} is membership`, data: membershipData });

        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch subcribe data." });
        }
    }

    // Insert new membership
    async insertMembership(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { name, rank, price, allowNew } = req.body;

        try {
            const membershipRepository = (await AppDataSource.getInstace()).getRepository(Membership);

            // Check if a membership with the same name exists
            const existingMembership = await membershipRepository.findOne({ where: { name } });
            if (existingMembership) {
                res.status(409).json({ message: 'Membership name already exists', data: existingMembership });
                return;
            }

            const newMembership = membershipRepository.create({ name, rank, price, allowNew });
            const insertedMembership = await membershipRepository.save(newMembership);

            res.status(201).json({ message: "Insert success", data: insertedMembership });
        } catch (error) {
            console.error('Error inserting membership:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Edit an existing membership
    async editMembership(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { id } = req.params;
        const { rank, price, allowNew } = req.body;

        try {
            const membershipRepository = (await AppDataSource.getInstace()).getRepository(Membership);
            const membership = await membershipRepository.findOne({ where: { id: Number(id) } });

            if (!membership) {
                res.status(404).json({ message: 'Membership not found' });
                return;
            }

            membership.rank = rank !== undefined ? rank : membership.rank;
            membership.price = price !== undefined ? price : membership.price;
            membership.allowNew = allowNew != undefined ? allowNew : membership.allowNew;

            const updatedMembership = await membershipRepository.save(membership);
            res.status(200).json({ message: "Update success", data: updatedMembership });
        } catch (error) {
            console.error('Error editing membership:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Hide a membership (soft delete)
    async hideMembership(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { id } = req.params;

        try {
            const membershipRepository = (await AppDataSource.getInstace()).getRepository(Membership);
            const membership = await membershipRepository.findOne({ where: { id: Number(id) } });

            if (!membership) {
                res.status(404).json({ message: 'Membership not found' });
                return;
            }

            membership.allowNew = Buffer.from([0]); // Assuming 0 means hidden/inactive
            await membershipRepository.save(membership);

            res.status(200).json({ message: 'Membership hidden successfully' });
        } catch (error) {
            console.error('Error hiding membership:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async all(req: Request, res: Response): Promise<void> {
        try {
            const discountRepository = (await AppDataSource.getInstace()).getRepository(Membership);
            const { page, pageSize, offset } = getValidatedPageInfo(req.query);
            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Membership);

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

export default new MembershipController;
