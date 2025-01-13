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
@Entity("BookRental", { schema: "test_doantotnghiep" })
export class BookRental {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("int", { name: "UserID" })
    userId!: number;

    @Column("int", { name: "BooksID" })
    booksId!: number;

    @Column("date", { name: "Expire_date" })
    expireDate!: string;

    @ManyToOne(() => User, (user) => user.bookRentals, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
    user!: User;

    @ManyToOne(() => Books, (books) => books.bookRentals, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "BooksID", referencedColumnName: "id" }])
    books!: Books;
}