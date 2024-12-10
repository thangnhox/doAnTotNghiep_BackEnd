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
import { Notes } from "./Notes";

@Index("TagsID", ["tagsId", "notesId"], { unique: true })
@Index("NotesID", ["notesId"], {})
@Entity("TagsNotes", { schema: "test_doantotnghiep" })
export class TagsNotes {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("int", { name: "TagsID" })
    tagsId!: number;

    @Column("int", { name: "NotesID" })
    notesId!: number;

    @ManyToOne(() => Tags, (tags) => tags.tagsNotes, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "TagsID", referencedColumnName: "id" }])
    tags!: Tags;

    @ManyToOne(() => Notes, (notes) => notes.tagsNotes, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "NotesID", referencedColumnName: "id" }])
    notes!: Notes;
}