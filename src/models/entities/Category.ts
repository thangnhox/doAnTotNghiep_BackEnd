import "reflect-metadata";
import {
    Column,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Books } from "./Books";

@Index("Name", ["name"], { unique: true })
@Entity("Category", { schema: "test_doantotnghiep" })
export class Category {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("varchar", { name: "Name", unique: true, length: 255 })
    name!: string;

    @ManyToMany(() => Books, (books) => books.categories)
    @JoinTable({
        name: "BookCategory",
        joinColumns: [{ name: "CategoryID", referencedColumnName: "id" }],
        inverseJoinColumns: [{ name: "BooksID", referencedColumnName: "id" }],
        schema: "test_doantotnghiep",
    })
    books!: Books[];

    static readonly validSortColumn = Object.freeze(['id', 'name']);
}
