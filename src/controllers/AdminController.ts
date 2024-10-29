import { Request, Response } from 'express';
import { createAppDataSource } from '../models/repository/Datasource';
import { User } from '../models/entities/User';
import { makeAuthenticationToken } from '../services/authentication';
import { checkReqUser } from '../util/checker';

class AdminController {
    async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).send("invalid request");
            return;
        }

        const AppDataSource = createAppDataSource();
        await AppDataSource.initialize();

        try {
            const userRepository = AppDataSource.getRepository(User);
            const userData = await userRepository.findOne({ where: { email } });
            if (!userData) {
                res.status(401).json({ message: "access denied" });
                return;
            }
            if (userData.password !== password || !userData.isAdmin) {
                res.status(401).send("access denied");
            } else {
                const token = makeAuthenticationToken(userData.id, userData.email);
                res.status(200).json({ message: "authentication confirmed", token });
            }
        } catch (error: any) {
            res.status(500).json({ message: "Authentication server error" });
        } finally {
            await AppDataSource.destroy();
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

        const AppDataSource = createAppDataSource();
        await AppDataSource.initialize();

        try {
            const userRepository = AppDataSource.getRepository(User);

            req.user!.password = req.body.newPassword;

            const savedChanged = await userRepository.save(req.user!);

            const newToken = makeAuthenticationToken(savedChanged.id, savedChanged.email);

            res.status(200).json({message: "change password success", data: savedChanged, token: newToken});
        } catch (error: any) {
            res.status(500).json({ message: "Database server error", error });
        } finally {
            await AppDataSource.destroy();
        }
    }
}

export default new AdminController;