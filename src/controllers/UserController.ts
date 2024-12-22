import { Request, Response } from 'express';
import { User } from '../models/entities/User';
import { makeAuthenticationToken, makePasswordResetToken, makeValidationToken } from '../services/authentication';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../models/repository/Datasource';
import { sendMail, sendVerificationEmail } from '../services/email';
import { decrypt } from '../util/crypto';

class UserController {
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
            const userRepository = (await AppDataSource.getInstance()).getRepository(User);

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

            const userRepository = (await AppDataSource.getInstance()).getRepository(User);

            const verified = await userRepository.findOne({ where: { email: user.email } });
            let token: string = "";

            if (!verified) {
                const toDatabase = userRepository.create(user);
                const savedUser = await userRepository.save(toDatabase);

                token = makeAuthenticationToken(savedUser.id, savedUser.email);
            } else {
                token = makeAuthenticationToken(verified.id, verified.email);
            }

            res.status(201).json({ message: "User validated", data: token });
        } catch (err: any) {
            res.status(400).json({ message: "invalid request" });
        }

    }


    async googleLogin(req: Request, res: Response): Promise<void> {
        const { uid, email, displayName, photoURL } = req.body;

        if (!uid ||
            !email ||
            !displayName ||
            !photoURL
        ) {
            res.status(400).json({ message: "Invalid request" });
        }

        try {
            const userRepository = (await AppDataSource.getInstance()).getRepository(User);
            let token: string = "";

            const existsUser = await userRepository.findOne({ where: { email: email } });
            if (!existsUser) {
                const user: User = new User();
                user.email = email;
                user.name = displayName;
                user.password = uid;
                user.avatar = photoURL;
                user.birthYear = null;

                const toDatabase = userRepository.create(user);
                const savedUser = await userRepository.save(toDatabase);

                token = makeAuthenticationToken(savedUser.id, savedUser.email);
            } else {
                if (!existsUser.avatar) {
                    existsUser.avatar = photoURL;
                    await userRepository.save(existsUser);
                }
                token = makeAuthenticationToken(existsUser.id, existsUser.email);
            }

            res.status(200).json({ message: "authentication confirmed", data: token });

        } catch (error: any) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            if (!email) {
                res.status(400).json({ message: "Invalid request format" });
                return;
            }

            const userRepository = (await AppDataSource.getInstance()).getRepository(User);
            const user = await userRepository.findOne({ where: { email } });

            if (!user) {
                res.status(404).json({ message: "Email not found" });
                return;
            }

            const token = makePasswordResetToken(user);
            const sendEmail = await sendMail(user.email, `<a href="${process.env.FRONT_END_ADDR}/resetPassword/${token}">change your password</a>`, "Change your password");

            if (sendEmail.code !== 1) {
                res.status(500).json({ message: `Error when sending email ${sendEmail.message}` });
                return;
            }

            res.status(200).json({ message: "Mail sent" });

        } catch (error) {
            console.error("Error while handling reset password request:", error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async confirmResetPassword(req: Request, res: Response): Promise<void> {
        const passwordResetToken = req.params.token as string;
        const secretKey = process.env.TOKEN_KEY as string;
        const { newPassword } = req.body;

        try {
            if (!newPassword) {
                res.status(400).json({ message: "Invalid format request" });
                return;
            }

            const enc_token = jwt.verify(passwordResetToken, secretKey) as { enc_token: string };

            const decoded = decrypt(enc_token.enc_token) as { userEmail: string, userName: string, userAvatar: string | null, userBirthYear: number };

            const userRepository = (await AppDataSource.getInstance()).getRepository(User);
            const user = await userRepository.findOne({ where: { email: decoded.userEmail } });

            if (!user) {
                res.status(404).json({ message: "User linked to this token has been deleted" });
                return;
            }

            user.password = newPassword;

            await userRepository.save(user);

            res.status(200).json({ message: "Password changed" });
            
        } catch (error) {
            console.error("Error while confirm reset password request:", error);
            res.status(500).json({ message: 'Invalid request' });
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

    async updateInfo(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Failed to fetch user data" });
            return;
        }

        const { name, birthYear, oldPassword, newPassword } = req.body;

        try {
            const changed: string[] = [];
            if (oldPassword && newPassword) {
                if (oldPassword !== req.user.password) {
                    res.status(403).json({ message: "Incorrect password" });
                    return;
                }

                req.user.password = newPassword;
                changed.push("password");
            }

            if (name && req.user.name !== name) {
                req.user.name = name;
                changed.push("name");
            }

            if (birthYear && req.user.birthYear !== birthYear) {
                req.user.birthYear = birthYear;
                changed.push("birthYear");
            }

            const userRepository = (await AppDataSource.getInstance()).getRepository(User);
            const saved = await userRepository.save(req.user);

            res.status(200).json({
                message: "Update success",
                data: {
                    Changed: changed,
                    Info: {
                        id: saved.id,
                        email: saved.email,
                        name: saved.name,
                        avatar: saved.avatar,
                        birthYear: saved.birthYear
                    }
                }
            });

        } catch (error) {
            console.error("Error while update user data:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async getUser(id: number): Promise<User | null> {

        try {
            const userRepository = (await AppDataSource.getInstance()).getRepository(User);
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
