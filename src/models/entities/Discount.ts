import "reflect-metadata";
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Orders } from "./Orders";
import { User } from "./User";
import { Subcribe } from "./Subcribe";

@Entity("Discount", { schema: "test_doantotnghiep" })
export class Discount {
  @PrimaryGeneratedColumn({ type: "int", name: "ID" })
  id!: number;

  @Column("varchar", { name: "Name", length: 255 })
  name!: string;

  @Column("date", { name: "Expire_date" })
  expireDate!: string;

  @Column("bit", { name: "Status" })
  status!: number;

  @OneToMany(() => Orders, (orders) => orders.discount)
  orders!: Orders[];

  @ManyToMany(() => User, (user) => user.discounts)
  @JoinTable({
    name: "Used",
    joinColumns: [{ name: "DiscountID", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "UserID", referencedColumnName: "id" }],
    schema: "test_doantotnghiep",
  })
  users!: User[];

  @OneToMany(() => Subcribe, (subcribe) => subcribe.discount)
  subcribes!: Subcribe[];
}
