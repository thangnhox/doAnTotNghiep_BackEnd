import "reflect-metadata";
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Orders } from "./Orders";
import { Discount } from "./Discount";
import { Subscribe } from "./Subscribe";
import { MembershipRecord } from "./MembershipRecord";
import { Notes } from "./Notes";
import { Books } from "./Books";
import { BookRequest } from "./BookRequest";

@Index("Email", ["email"], { unique: true })
@Index("Name", ["name"], { unique: true })
@Index("Email_2", ["email"], {})
@Entity("User", { schema: "test_doantotnghiep" })
export class User {
  @PrimaryGeneratedColumn({ type: "int", name: "ID" })
  id!: number;

  @Column("varchar", { name: "Email", unique: true, length: 255 })
  email!: string;

  @Column("varchar", { name: "password", length: 255 })
  password!: string;

  @Column("varchar", { name: "Name", unique: true, length: 255 })
  name!: string;

  @Column("int", { name: "BirthYear" })
  birthYear!: number;

  @Column("varchar", { name: "Avatar", nullable: true, length: 255 })
  avatar!: string | null;

  @OneToMany(() => Orders, (orders) => orders.user)
  orders!: Orders[];

  @ManyToMany(() => Discount, (discount) => discount.users)
  discounts!: Discount[];

  @OneToMany(() => Subscribe, (subscribe) => subscribe.user)
  subcribes!: Subscribe[];

  @OneToMany(
    () => MembershipRecord,
    (membershipRecord) => membershipRecord.user
  )
  membershipRecords!: MembershipRecord[];

  @OneToMany(() => Notes, (notes) => notes.user)
  notes!: Notes[];

  @ManyToMany(() => Books, (books) => books.users)
  @JoinTable({
    name: "Likes",
    joinColumns: [{ name: "UserID", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "BooksID", referencedColumnName: "id" }],
    schema: "test_doantotnghiep",
  })
  books!: Books[];

  @OneToMany(() => BookRequest, (bookRequest) => bookRequest.user)
  bookRequests!: BookRequest[];
}
