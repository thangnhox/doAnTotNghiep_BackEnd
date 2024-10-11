import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";
import { Discount } from "./Discount";
import { Books } from "./Books";
import { UserMembership } from "./UserMembership";

@Entity("Membership", { schema: "test_doantotnghiep" })
export class Membership {
  @Column("varchar", { primary: true, name: "ID", length: 255 })
  id: string;

  @Column("varchar", { name: "Name", length: 255 })
  name: string;

  @Column("int", { name: "Rank" })
  rank: number;

  @Column("tinyint", { name: "AllowNew", width: 1, default: () => "'1'" })
  allowNew: boolean;

  @ManyToMany(() => Discount, (discount) => discount.memberships)
  @JoinTable({
    name: "Membership_Discount",
    joinColumns: [{ name: "MembershipID", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "DiscountID", referencedColumnName: "id" }],
    schema: "test_doantotnghiep",
  })
  discounts: Discount[];

  @ManyToMany(() => Books, (books) => books.memberships)
  @JoinTable({
    name: "Book_Membership",
    joinColumns: [{ name: "MembershipID", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "BooksID", referencedColumnName: "id" }],
    schema: "test_doantotnghiep",
  })
  books: Books[];

  @OneToMany(
    () => UserMembership,
    (userMembership) => userMembership.membership
  )
  userMemberships: UserMembership[];
}
