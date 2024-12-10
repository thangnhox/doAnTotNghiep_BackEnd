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
import { TagsNotes } from "./TagsNotes";
import { User } from "./User";
import { TagsBooks } from "./TagsBooks";

@Index("UserID", ["userId", "name"], { unique: true })
@Entity("Tags", { schema: "test_doantotnghiep" })
export class Tags {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("int", { name: "UserID" })
    userId!: number;

    @Column("varchar", { name: "Name", length: 255 })
    name!: string;

    @OneToMany(() => TagsNotes, (tagsNotes) => tagsNotes.tags)
    tagsNotes!: TagsNotes[];

    @ManyToOne(() => User, (user) => user.tags, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
    user!: User;

    @OneToMany(() => TagsBooks, (tagsBooks) => tagsBooks.tags)
    tagsBooks!: TagsBooks[];
}
