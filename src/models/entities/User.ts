import "reflect-metadata";
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from "typeorm";
import { UserMembership } from "./UserMembership";
import { Orders } from "./Orders";
import { Books } from "./Books";
import { Notes } from "./Notes";

@Index("email", ["email"], { unique: true })
@Entity("User", { schema: "test_doantotnghiep" })
export class User {
  @Column("varchar", { primary: true, name: "ID", length: 255 })
  id!: string;

  @Column("varchar", { name: "email", unique: true, length: 255 })
  email!: string;

  @Column("varchar", { name: "password", length: 255 })
  password!: string;

  @Column("varchar", { name: "Name", length: 255 })
  name!: string;

  @Column("int", { name: "BirthYear" })
  birthYear!: number;

  @Column("varchar", { name: "Avatar", length: 255 })
  avatar!: string;

  @OneToMany(() => UserMembership, (userMembership) => userMembership.user)
  userMemberships!: UserMembership[];

  @OneToMany(() => Orders, (orders) => orders.user)
  orders!: Orders[];

  @ManyToMany(() => Books, (books) => books.users)
  @JoinTable({
    name: "Likes",
    joinColumns: [{ name: "UserID", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "BooksID", referencedColumnName: "id" }],
    schema: "test_doantotnghiep",
  })
  books!: Books[];

  @OneToMany(() => Notes, (notes) => notes.user)
  notes!: Notes[];
}
