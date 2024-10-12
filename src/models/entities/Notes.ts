import "reflect-metadata";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Books } from "./Books";

@Index("BooksID", ["booksId"], {})
@Entity("Notes", { schema: "test_doantotnghiep" })
export class Notes {
  @Column("int", { primary: true, name: "UserID" })
  userId!: number;

  @Column("int", { primary: true, name: "BooksID" })
  booksId!: number;

  @Column("int", { primary: true, name: "Page" })
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
}
