import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = process.env.TOKEN_KEY as string;

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        res.status(403).send('Forbidden');
        return;
    }

    try {
        const decoded = jwt.verify(token, secretKey) as { userID: number, email: string };
        req.token = decoded;
        next();
    } catch (err) {
        res.status(401).send('Invalid token');
    }
};

export const makeToken = (userID: number, email: string) => {
    return jwt.sign({
        userID: userID,
        email: email,
    }, secretKey, { expiresIn: '1d' });
}
