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
import { Authors } from "../entities/Authors";
import { Tags } from "../entities/Tags";
import { TagsBooks } from "../entities/TagsBooks";
import { BookDetails } from "../views/BookDetails";
import { Bill } from "../entities/Bill";
import { TagsNotes } from "../entities/TagsNotes";
import { ReadHistory } from "../entities/ReadHistory";

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
        entities: [BookRequest, Books, Category, Discount, Membership, MembershipRecord, Notes, Orders, Publisher, Subscribe, User, Authors, Tags, TagsBooks, BookDetails, Bill, TagsNotes, ReadHistory],
        migrations: [],
        subscribers: [],
        connectionTimeout: 15000,
        acquireTimeout: 15000,
    });
}

export class AppDataSource {
    private static appDataSource: DataSource = createAppDataSource();

    static async getInstance(): Promise<DataSource> {
        if (!this.appDataSource.isInitialized) {
            console.time("Init database");
            try {
                await this.appDataSource.initialize();
            } catch (err: any) {
                throw (err);
            }
            console.timeEnd("Init database");
        }
        return this.appDataSource;
    }

    static async shutdown(): Promise<void> {
        if (!this.appDataSource.isInitialized) return;
        await this.appDataSource.destroy();
    }
}
