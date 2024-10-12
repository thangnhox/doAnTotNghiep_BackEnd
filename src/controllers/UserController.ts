import { Request, Response } from 'express';
import { createAppDataSource } from '../models/repository/Datasource';
import { User } from '../models/entities/User';
import { makeToken } from '../services/authentication';

class UserController {
    async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        
        if (!email || !password) {
            res.status(400).send("invalid request");
            return;
        }
        
        const AppDataSource = createAppDataSource();
        try {
            await AppDataSource.initialize();
            const userRepository = AppDataSource.getRepository(User);
            const userData = await userRepository.findOne({ where: { email } });
            if (!userData) {
                res.status(404).json({message: "user email not found"});
                return;
            }
            if (userData.password != password) {
                res.status(401).send("access denied");
                return;
            }

            const token = makeToken(userData.id, userData.email);
            res.status(200).json({message: "authentication confirmed", token: token});
        } catch (error: any) {
            res.status(500).send("Authentication server error");
        }
    }

    async createUser(req: Request, res: Response): Promise<void> {
        const user: User = req.body;

        if (
            !req.body.email ||
            !req.body.password ||
            !req.body.birthYear ||
            !req.body.name
        ) {
            res.status(400).send("invalid request");
            return;
        }
        
        const newUser: User = new User();

        if (req.body.avatar) {
            newUser.avatar = req.body.avatar;
        }

        const AppDataSource = createAppDataSource();
        try {
            await AppDataSource.initialize();
            const userRepository = AppDataSource.getRepository(User);

            const email = req.body.email;
            const existingUser = userRepository.findOne({ where: { email } });

            if (existingUser != null) {
                res.status(409).json({message: "user already exists"});
            }

            newUser.email = req.body.email;
            newUser.password = req.body.password;
            newUser.birthYear = req.body.birthYear;
            newUser.name = req.body.name;

            const toDatabase = userRepository.create(newUser);
            const savedUser = await userRepository.save(toDatabase);
            res.status(201).json({message: "create user success", token: makeToken(savedUser.id, savedUser.email)});
        } catch (error: any) {
            res.status(500).send("Authentication server error");
        }

    }
}

export default new UserController;