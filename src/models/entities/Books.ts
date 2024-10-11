import "reflect-metadata";
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from "typeorm";
import { Publishing } from "./Publishing";
import { Discount } from "./Discount";
import { Membership } from "./Membership";
import { Orders } from "./Orders";
import { User } from "./User";
import { Notes } from "./Notes";
import { Category } from "./Category";

@Index("Title", ["title"], {})
@Entity("Books", { schema: "test_doantotnghiep" })
export class Books {
  @Column("varchar", { primary: true, name: "ID", length: 255 })
  id!: string;

  @Column("varchar", { name: "Title", length: 255 })
  title!: string;

  @Column("float", { name: "Price", precision: 12 })
  price!: number;

  @Column("varchar", { name: "file_url", length: 255 })
  fileUrl!: string;

  @Column("varchar", { name: "cover_url", nullable: true, length: 255 })
  coverUrl!: string | null;

  @Column("bit", { name: "status" })
  status!: number;

  @OneToMany(() => Publishing, (publishing) => publishing.books)
  publishings!: Publishing[];

  @ManyToMany(() => Discount, (discount) => discount.books)
  @JoinTable({
    name: "Book_Discount",
    joinColumns: [{ name: "BooksID", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "DiscountID", referencedColumnName: "id" }],
    schema: "test_doantotnghiep",
  })
  discounts!: Discount[];

  @ManyToMany(() => Membership, (membership) => membership.books)
  memberships!: Membership[];

  @OneToMany(() => Orders, (orders) => orders.books)
  orders!: Orders[];

  @ManyToMany(() => User, (user) => user.books)
  users!: User[];

  @OneToMany(() => Notes, (notes) => notes.books)
  notes!: Notes[];

  @ManyToMany(() => Category, (category) => category.books)
  categories!: Category[];
}
