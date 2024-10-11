import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Membership } from "./Membership";
import { User } from "./User";

@Index("UserID", ["userId"], {})
@Entity("User_Membership", { schema: "test_doantotnghiep" })
export class UserMembership {
  @Column("varchar", { primary: true, name: "MembershipID", length: 255 })
  membershipId: string;

  @Column("varchar", { primary: true, name: "UserID", length: 255 })
  userId: string;

  @Column("date", { name: "Expire_date" })
  expireDate: string;

  @ManyToOne(() => Membership, (membership) => membership.userMemberships, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "MembershipID", referencedColumnName: "id" }])
  membership: Membership;

  @ManyToOne(() => User, (user) => user.userMemberships, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
  user: User;
}
