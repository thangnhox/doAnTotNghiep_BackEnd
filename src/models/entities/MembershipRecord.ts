import "reflect-metadata";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Membership } from "./Membership";

@Index("MembershipID", ["membershipId"], {})
@Entity("MembershipRecord", { schema: "test_doantotnghiep" })
export class MembershipRecord {
  @Column("int", { primary: true, name: "UserID" })
  userId!: number;

  @Column("int", { primary: true, name: "MembershipID" })
  membershipId!: number;

  @Column("date", { name: "Expire_date" })
  expireDate!: string;

  @ManyToOne(() => User, (user) => user.membershipRecords, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
  user!: User;

  @ManyToOne(() => Membership, (membership) => membership.membershipRecords, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "MembershipID", referencedColumnName: "id" }])
  membership!: Membership;

  static readonly validSortColumn = Object.freeze(['userId', 'membershipId', 'expireDate']);
}
