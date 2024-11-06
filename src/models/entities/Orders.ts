import "reflect-metadata";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Books } from "./Books";
import { Discount } from "./Discount";

@Index("BooksID", ["booksId"], {})
@Index("DiscountID", ["discountId"], {})
@Entity("Orders", { schema: "test_doantotnghiep" })
export class Orders {
  @Column("int", { primary: true, name: "UserID" })
  userId!: number;

  @Column("int", { primary: true, name: "BooksID" })
  booksId!: number;

  @Column("int", { name: "DiscountID", nullable: true })
  discountId!: number | null;

  @Column("decimal", { name: "TotalPrice", precision: 10, scale: 2 })
  totalPrice!: string;

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

  @ManyToOne(() => Discount, (discount) => discount.orders, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "DiscountID", referencedColumnName: "id" }])
  discount!: Discount;

  static readonly validSortColumn = Object.freeze(['userId', 'date', 'totalPrice']);
}
