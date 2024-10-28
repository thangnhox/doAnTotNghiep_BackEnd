import { Request, Response } from 'express';
import { createAppDataSource } from '../models/repository/Datasource';
import { User } from '../models/entities/User';
import { makeAuthenticationToken } from '../services/authentication';

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
                res.status(404).json({ message: "user email not found" });
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

    async isAdmin(id: number): Promise<boolean> {
        const AppDataSource = createAppDataSource();
        await AppDataSource.initialize();

        try {
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { id } });
            if (user == null) {
                return false;
            }
            return user.isAdmin;
        } catch (error) {
            console.error("Error checking admin status:", error);
            return false;
        } finally {
            await AppDataSource.destroy();
        }
    }
}

export default new AdminController;