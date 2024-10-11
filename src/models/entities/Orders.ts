import "reflect-metadata";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Books } from "./Books";

@Index("BooksID", ["booksId"], {})
@Entity("Orders", { schema: "test_doantotnghiep" })
export class Orders {
  @Column("varchar", { primary: true, name: "UserID", length: 255 })
  userId!: string;

  @Column("varchar", { primary: true, name: "BooksID", length: 255 })
  booksId!: string;

  @Column("date", { name: "Date" })
  date!: string;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
  user!: User;

  @ManyToOne(() => Books, (books) => books.orders, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "BooksID", referencedColumnName: "id" }])
  books!: Books;
}
