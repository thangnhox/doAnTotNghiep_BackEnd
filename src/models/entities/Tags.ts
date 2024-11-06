import "reflect-metadata";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { TagsBooks } from "./TagsBooks";
import { Notes } from "./Notes";

@Index("UserID", ["userId", "name"], { unique: true })
@Entity("Tags", { schema: "test_doantotnghiep" })
export class Tags {
  @PrimaryGeneratedColumn({ type: "int", name: "ID" })
  id!: number;

  @Column("int", { name: "UserID" })
  userId!: number;

  @Column("varchar", { name: "Name", length: 255 })
  name!: string;

  @ManyToOne(() => User, (user) => user.tags, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
  user!: User;

  @OneToMany(() => TagsBooks, (tagsBooks) => tagsBooks.tags)
  tagsBooks!: TagsBooks[];

  @ManyToMany(() => Notes, (notes) => notes.tags)
  @JoinTable({
    name: "TagsNotes",
    joinColumns: [{ name: "TagsID", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "NotesID", referencedColumnName: "id" }],
    schema: "test_doantotnghiep",
  })
  notes!: Notes[];

  static readonly validSortColumn = Object.freeze(['id', 'name', 'userId']);
}
