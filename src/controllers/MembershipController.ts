import { Request, Response } from 'express';
import { User } from '../models/entities/User';
import { AppDataSource } from '../models/repository/Datasource';
import { MembershipRecord } from '../models/entities/MembershipRecord';

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
}

export default new MembershipController;