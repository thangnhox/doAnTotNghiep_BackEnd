import { DataSource } from "typeorm";
import { Books } from "../entities/Books";
import { Category } from "../entities/Category";
import { Discount } from "../entities/Discount";
import { Membership } from "../entities/Membership";
import { Notes } from "../entities/Notes";
import { Orders } from "../entities/Orders";
import { Publisher } from "../entities/Publisher";
import { User } from "../entities/User";
import { BookRequest } from "../entities/BookRequest";
import { MembershipRecord } from "../entities/MembershipRecord";
import { Subscribe } from "../entities/Subscribe";

function createAppDataSource(): DataSource {
    return new DataSource({
        type: process.env.DB_TYPE as any,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        synchronize: false,
        logging: true,
        entities: [BookRequest, Books, Category, Discount, Membership, MembershipRecord, Notes, Orders, Publisher, Subscribe, User],
        migrations: [],
        subscribers: [],
    });
}

export class AppDataSource {
    private static appDataSource: DataSource = createAppDataSource();

    static async getInstace(): Promise<DataSource> {
        if (!this.appDataSource.isInitialized) {
            try {
                await this.appDataSource.initialize();
            } catch (err: any) {
                throw(err);
            }
        }
        return this.appDataSource;
    }

    static async shutdown(): Promise<void> {
        if (!this.appDataSource.isInitialized) return;
        await this.appDataSource.destroy();
    }
}