declare namespace Express {
    export interface Request {
        token?: {
            userID: number;
            email: string;
        };
    }
}
