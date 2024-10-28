import { User } from '../models/entities/User';

declare global {
    namespace Express {
        interface Request {
            token?: {
                userID: number;
                email: string;
            };
            user?: User;
        }
    }
}
