import "reflect-metadata";
import {
    Column,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Books } from "./Books";

@Index("Name", ["name", "birthDate"], { unique: true })
@Entity("Authors", { schema: "test_doantotnghiep" })
export class Authors {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("varchar", { name: "Name", length: 255 })
    name!: string;

    @Column("date", { name: "BirthDate", nullable: true })
    birthDate!: string | null;

    @Column("text", { name: "Description" })
    description!: string;

    @Column("varchar", { name: "Nationality", nullable: true, length: 100 })
    nationality!: string | null;

    @OneToMany(() => Books, (books) => books.authors)
    books!: Books[];

    static readonly validSortColumn = Object.freeze(['id', 'name', 'nationality']);
}
