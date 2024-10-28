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
import { Membership } from "./Membership";
import { Discount } from "./Discount";

@Index("UserID", ["userId"], {})
@Index("MembershipID", ["membershipId"], {})
@Index("DiscountID", ["discountId"], {})
@Entity("Subscribe", { schema: "test_doantotnghiep" })
export class Subscribe {
  @PrimaryGeneratedColumn({ type: "int", name: "ID" })
  id!: number;

  @Column("int", { name: "UserID" })
  userId!: number;

  @Column("int", { name: "MembershipID" })
  membershipId!: number;

  @Column("int", { name: "DiscountID", nullable: true })
  discountId!: number | null;

  @Column("decimal", { name: "TotalPrice", precision: 10, scale: 2 })
  totalPrice!: string;

  @Column("date", { name: "Date" })
  date!: string;

  @ManyToOne(() => User, (user) => user.subscribes, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
  user!: User;

  @ManyToOne(() => Membership, (membership) => membership.subscribes, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "MembershipID", referencedColumnName: "id" }])
  membership!: Membership;

  @ManyToOne(() => Discount, (discount) => discount.subscribes, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "DiscountID", referencedColumnName: "id" }])
  discount!: Discount;
}
