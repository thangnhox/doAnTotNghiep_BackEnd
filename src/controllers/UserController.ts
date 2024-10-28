import { Request, Response } from 'express';
import { createAppDataSource } from '../models/repository/Datasource';
import { User } from '../models/entities/User';
import { makeAuthenticationToken, makeValidationToken } from '../services/authentication';
import jwt from 'jsonwebtoken';

class UserController {
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
            if (userData.password === '') { // Tài khoản loại đăng nhập bằng google
                res.status(400).json({ message: "Incorrect login info" });
            } else if (userData.password !== password) {
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
        await AppDataSource.initialize();

        try {
            const userRepository = AppDataSource.getRepository(User);

            const email = req.body.email;
            const existingUser = await userRepository.findOne({ where: { email } });

            if (existingUser != null) {
                res.status(409).json({ message: "user already exists" });
                return;
            }

            newUser.email = req.body.email;
            newUser.password = req.body.password;
            newUser.birthYear = req.body.birthYear;
            newUser.name = req.body.name;

            const newUserToken = makeValidationToken(newUser);
            // TODO: gửi mail chứa url có token
            res.status(201).json({ message: "create user success", token: newUserToken });

            await AppDataSource.destroy();
        } catch (error: any) {
            res.status(500).json({ message: "Authentication server error" });
        }

    }

    async validateUser(req: Request, res: Response): Promise<void> {
        const validateToken = req.params.token as string;
        const secretKey = process.env.TOKEN_KEY as string;

        const AppDataSource = createAppDataSource();
        await AppDataSource.initialize();

        try {
            const decoded = jwt.verify(validateToken, secretKey) as { userEmail: string, userName: string, userPassword: string, userAvatar: string | null, userBirthYear: number };

            const user: User = new User();
            user.email = decoded.userEmail;
            user.name = decoded.userName;
            user.password = decoded.userPassword;
            user.avatar = decoded.userAvatar;
            user.birthYear = decoded.userBirthYear;

            const userRepository = AppDataSource.getRepository(User);

            const toDatabase = userRepository.create(user);
            const savedUser = await userRepository.save(toDatabase);

            const newUserToken = makeAuthenticationToken(savedUser.id, savedUser.email);

            // TODO: make use of this token

            res.status(201).json({ message: "User validated", token: newUserToken });
            await AppDataSource.destroy();
        } catch (err: any) {
            res.status(400).json({ message: "invalid request" });
        } finally {
            await AppDataSource.destroy();
        }

    }


    async getUser(id: number): Promise<User | null> {
        const AppDataSource = createAppDataSource();
        await AppDataSource.initialize();

        try {
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { id } });
            if (user == null) {
                return null;
            }
            return user;
        } catch (error) {
            console.error("Error checking admin status:", error);
            return null;
        } finally {
            await AppDataSource.destroy();
        }
    }

}

export default new UserController;