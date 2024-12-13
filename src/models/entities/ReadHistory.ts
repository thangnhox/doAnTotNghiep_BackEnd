import "reflect-metadata";
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Books } from "./Books";

@Index("UserID", ["userId", "booksId"], { unique: true })
@Index("BooksID", ["booksId"], {})
@Entity("ReadHistory", { schema: "test_doantotnghiep" })
export class ReadHistory {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("int", { name: "UserID" })
    userId!: number;

    @Column("int", { name: "BooksID" })
    booksId!: number;

    @Column("int", { name: "LastRead" })
    lastRead!: number;

    @Column("int", { name: "Progress" })
    progress!: number;

    @ManyToOne(() => User, (user) => user.readHistories, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
    user!: User;

    @ManyToOne(() => Books, (books) => books.readHistories, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "BooksID", referencedColumnName: "id" }])
    books!: Books;
}