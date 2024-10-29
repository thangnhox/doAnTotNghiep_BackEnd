import { Request, Response } from 'express';

export function checkReqUser(req: Request, res: Response, admin: number = 1): boolean {
    if (req.user === undefined) {
        res.status(500).json({ message: "Error getting data from authentication" });
        return false;
    }
    if (req.user.isAdmin !== admin) {
        res.status(403).send('Invalid user');
        return false;
    }
    return true;
}