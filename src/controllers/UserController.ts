import { Request, Response } from 'express';
import { User } from '../models/entities/User';
import { makeAuthenticationToken, makeValidationToken } from '../services/authentication';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../models/repository/Datasource';
import { sendVerificationEmail } from '../services/email';
import { decrypt } from '../util/crypto';
import { auth, GoogleAuthProvider, signInWithCredential } from '../services/firebase';
import { v4 as uuidv4 } from 'uuid';

class UserController {
    async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        try {
            const userRepository = (await AppDataSource.getInstace()).getRepository(User);
            const userData = await userRepository.findOne({ where: { email } });
            if (!userData) {
                res.status(404).json({ message: "user email not found" });
                return;
            }
            if (userData.password === '') { // Tài khoản loại đăng nhập bằng google
                res.status(400).json({ message: "Incorrect login info" });
            } else if (userData.password !== password) {
                res.status(401).json({ message: "access denied" });
            } else {
                const token = makeAuthenticationToken(userData.id, userData.email);
                res.status(200).json({ message: "authentication confirmed", data: token });
            }
        } catch (error: any) {
            res.status(500).json({ message: "Authentication server error" });
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
            res.status(400).json({ message: "invalid request" });
            return;
        }

        const newUser: User = new User();

        if (req.body.avatar) {
            newUser.avatar = req.body.avatar;
        }



        try {
            const userRepository = (await AppDataSource.getInstace()).getRepository(User);

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
            // res.status(201).json({ message: "create user success", data: newUserToken }); // => http//fron-ent.com/verify/:newUserToken

            // get http://back-end.com/varify/:newUserToken

            // redirect ....

            const sendEmail = await sendVerificationEmail(newUser.email, newUserToken);

            if (sendEmail.code !== 1) {
                res.status(500).json({ message: `Error when sending email ${sendEmail.message}` });
                return;
            }

            res.status(200).json({ message: "Mail sent" });

        } catch (error: any) {
            res.status(500).json({ message: "Authentication server error" });
        }

    }

    async validateUser(req: Request, res: Response): Promise<void> {
        const validateToken = req.params.token as string;
        const secretKey = process.env.TOKEN_KEY as string;

        try {
            const enc_token = jwt.verify(validateToken, secretKey) as { enc_token: string };

            const decoded = decrypt(enc_token.enc_token) as { userEmail: string, userName: string, userPassword: string, userAvatar: string | null, userBirthYear: number };

            const user: User = new User();
            user.email = decoded.userEmail;
            user.name = decoded.userName;
            user.password = decoded.userPassword;
            user.avatar = decoded.userAvatar;
            user.birthYear = decoded.userBirthYear;

            const userRepository = (await AppDataSource.getInstace()).getRepository(User);

            const verified = await userRepository.findOne({ where: { email: user.email } });
            let token: string = "";

            if (!verified) {
                const toDatabase = userRepository.create(user);
                const savedUser = await userRepository.save(toDatabase);

                token = makeAuthenticationToken(savedUser.id, savedUser.email);
            } else {
                token = makeAuthenticationToken(verified.id, verified.email);
            }

            // TODO: make use of this token

            res.status(201).json({ message: "User validated", data: token });
        } catch (err: any) {
            res.status(400).json({ message: "invalid request" });
        }

    }


    async googleLogin(req: Request, res: Response): Promise<void> {
        const { idToken } = req.body;

        if (!idToken) {
            res.status(400).json({ message: "Invalid request" });
        }

        try {
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            const userData = userCredential.user;

            const userRepository = (await AppDataSource.getInstace()).getRepository(User);
            let token: string = "";

            if (!userData.email ||
                !userData.displayName ||
                !userData.photoURL
            ) {
                res.status(400).json({ message: "Invalid token" });
                return;
            }

            const existsUser = await userRepository.findOne({ where: { email: userData.email } });
            if (!existsUser) {
                const user: User = new User();
                user.email = userData.email;
                user.name = userData.displayName;
                user.password = uuidv4(); // Random password
                user.avatar = userData.photoURL;
                user.birthYear = 2000;

                const toDatabase = userRepository.create(user);
                const savedUser = await userRepository.save(toDatabase);

                token = makeAuthenticationToken(savedUser.id, savedUser.email);
            } else {
                token = makeAuthenticationToken(existsUser.id, existsUser.email);
            }

            res.status(200).json({ message: "authentication confirmed", data: token });

        } catch (error: any) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async info(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Failed to fetch user data" });
            return;
        }

        res.status(200).json({ 
            message: "User info",
            data: { 
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                avatar: req.user.avatar,
                birthYear: req.user.birthYear
            }
        })
    }


    async getUser(id: number): Promise<User | null> {

        try {
            const userRepository = (await AppDataSource.getInstace()).getRepository(User);
            const user = await userRepository.findOne({ where: { id } });
            if (user == null) {
                return null;
            }
            return user;
        } catch (error) {
            console.error("Error checking admin status:", error);
            return null;
        }
    }

}

export default new UserController;