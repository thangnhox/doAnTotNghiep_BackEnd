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

@Index("UserID", ["userId"], {})
@Index("Title", ["title"], {})
@Entity("BookRequest", { schema: "test_doantotnghiep" })
export class BookRequest {
  @PrimaryGeneratedColumn({ type: "int", name: "ID" })
  id!: number;

  @Column("varchar", { name: "Title", length: 255 })
  title!: string;

  @Column("text", { name: "Description", nullable: true })
  description!: string | null;

  @Column("int", { name: "UserID" })
  userId!: number;

  @ManyToOne(() => User, (user) => user.bookRequests, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
  user!: User;

  static readonly validSortColumn = Object.freeze(['id', 'title', 'userId']);
}
