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
import { Books } from "./Books";
import { Subcribe } from "./Subcribe";
import { MembershipRecord } from "./MembershipRecord";

@Index("Name", ["name"], { unique: true })
@Entity("Membership", { schema: "test_doantotnghiep" })
export class Membership {
  @PrimaryGeneratedColumn({ type: "int", name: "ID" })
  id!: number;

  @Column("varchar", { name: "Name", unique: true, length: 255 })
  name!: string;

  @Column("int", { name: "Rank" })
  rank!: number;

  @Column("bit", { name: "AllowNew" })
  allowNew!: number;

  @Column("decimal", { name: "Price", precision: 10, scale: 2 })
  price!: string;

  @ManyToMany(() => Books, (books) => books.memberships)
  @JoinTable({
    name: "BookMembership",
    joinColumns: [{ name: "MembershipID", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "BooksID", referencedColumnName: "id" }],
    schema: "test_doantotnghiep",
  })
  books!: Books[];

  @OneToMany(() => Subcribe, (subcribe) => subcribe.membership)
  subcribes!: Subcribe[];

  @OneToMany(
    () => MembershipRecord,
    (membershipRecord) => membershipRecord.membership
  )
  membershipRecords!: MembershipRecord[];
}
