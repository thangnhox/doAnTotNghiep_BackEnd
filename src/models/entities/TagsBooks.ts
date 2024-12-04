import "reflect-metadata";
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Tags } from "./Tags";
import { Books } from "./Books";

@Index("TagsID", ["tagsId", "booksId", "page"], { unique: true })
@Index("BooksID", ["booksId"], {})
@Entity("TagsBooks", { schema: "test_doantotnghiep" })
export class TagsBooks {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("int", { name: "TagsID" })
    tagsId!: number;

    @Column("int", { name: "BooksID" })
    booksId!: number;

    @Column("int", { name: "Page", default: () => "'-1'" })
    page!: number;

    @ManyToOne(() => Tags, (tags) => tags.tagsBooks, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "TagsID", referencedColumnName: "id" }])
    tags!: Tags;

    @ManyToOne(() => Books, (books) => books.tagsBooks, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "BooksID", referencedColumnName: "id" }])
    books!: Books;

    static readonly validSortColumn = Object.freeze(['id', 'name']);
}
