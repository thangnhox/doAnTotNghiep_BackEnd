import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/entities/User';
import UserController from '../controllers/UserController';

const secretKey = process.env.TOKEN_KEY as string;

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        res.status(403).send('Forbidden');
        return;
    }
    try {
        const decoded = jwt.verify(token, secretKey) as { userID: number, email: string };
        req.token = decoded;
        const user = await UserController.getUser(decoded.userID);

        if (user === null) {
            res.status(404).send('User no longer exist');
            return;
        }
        req.user = user;

        next();
    } catch (err) {
        res.status(401).send('Invalid token');
    }
};

export const makeAuthenticationToken = (userID: number, email: string) => {
    return jwt.sign({
        userID: userID,
        email: email,
    }, secretKey, { expiresIn: '1d' });
}

export const makeValidationToken = (user: User) => {
    return jwt.sign({
        userEmail: user.email,
        userName: user.name,
        userPassword: user.password,
        userBirthYear: user.birthYear,
        userAvatar: user.avatar
    }, secretKey, { expiresIn: '1h' });
}
