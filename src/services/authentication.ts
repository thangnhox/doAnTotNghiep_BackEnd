import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/entities/User';
import UserController from '../controllers/UserController';
import MembershipController from '../controllers/MembershipController';
import { decrypt, encrypt } from '../util/crypto';

const secretKey = process.env.TOKEN_KEY as string;

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        res.status(403).send('Forbidden');
        return;
    }
    try {
        const enc_token = jwt.verify(token, secretKey) as { enc_token: string };
        req.token = decrypt(enc_token.enc_token) as { userID: number, email: string };
        const user = await UserController.getUser(req.token.userID);

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

interface validToken {
    valid: boolean;
    message: string | null;
    code: number;
}

export const validateTokenJWT = async (req: Request): Promise<validToken> => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return { valid: false, message: "No token", code: -1 };
    }
    try {
        const enc_token = jwt.verify(token, secretKey) as { enc_token: string };
        req.token = decrypt(enc_token.enc_token) as { userID: number, email: string };
        const user = await UserController.getUser(req.token.userID);

        if (user === null) {
            return { valid: false, message: "User no longer exists", code: -2 };
        }
        req.user = user;

        const isMemberShip = await MembershipController.isValidUser(user);
        
        if (!isMemberShip) return { valid: false, message: "Not a membership", code: 1 };

        return { valid: true, message: null, code: 200 };

    } catch (err) {
        return { valid: false, message: "Invalid Token", code: -255 };
    }
}

export const makeAuthenticationToken = (userID: number, email: string) => {
    const enc_token = encrypt({
        userID: userID,
        email: email,
    });

    return jwt.sign({ enc_token }, secretKey, { expiresIn: '1d' });
}

export const makeValidationToken = (user: User) => {
    const enc_token = encrypt({
        userEmail: user.email,
        userName: user.name,
        userPassword: user.password,
        userBirthYear: user.birthYear,
        userAvatar: user.avatar
    });

    return jwt.sign({ enc_token }, secretKey, { expiresIn: '1h' });
}
