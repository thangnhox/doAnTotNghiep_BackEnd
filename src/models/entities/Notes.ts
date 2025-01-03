import "reflect-metadata";
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Books } from "./Books";
import { TagsNotes } from "./TagsNotes";

@Index("UserID", ["userId", "booksId", "page"], { unique: true })
@Index("BooksID", ["booksId"], {})
@Entity("Notes", { schema: "test_doantotnghiep" })
export class Notes {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("int", { name: "UserID" })
    userId!: number;

    @Column("int", { name: "BooksID" })
    booksId!: number;

    @Column("int", { name: "Page", default: () => "'-1'" })
    page!: number;

    @Column("text", { name: "Detail", nullable: true })
    detail!: string | null;

    @ManyToOne(() => User, (user) => user.notes, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
    user!: User;

    @ManyToOne(() => Books, (books) => books.notes, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "BooksID", referencedColumnName: "id" }])
    books!: Books;

    @OneToMany(() => TagsNotes, (tagsNotes) => tagsNotes.notes)
    tagsNotes!: TagsNotes[];
}