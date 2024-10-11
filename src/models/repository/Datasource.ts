import { DataSource } from "typeorm";
import { Books } from "../entities/Books";
import { Category } from "../entities/Category";
import { Discount } from "../entities/Discount";
import { Membership } from "../entities/Membership";
import { Notes } from "../entities/Notes";
import { Orders } from "../entities/Orders";
import { Publisher } from "../entities/Publisher";
import { Publishing } from "../entities/Publishing";
import { User } from "../entities/User";
import { UserMembership } from "../entities/UserMembership";

export function createAppDataSource(): DataSource {
    return new DataSource({
        type: "mariadb",
        host: "minutes-played.gl.at.ply.gg",
        port: 17131,
        username: "app",
        password: "app",
        database: "test_DoAnTotNghiep",
        synchronize: false,
        logging: true,
        entities: [Books, Category, Discount, Membership, Notes, Orders, Publisher, Publishing, User, UserMembership],
        migrations: [],
        subscribers: [],
    });
}