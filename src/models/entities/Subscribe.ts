import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Membership } from "./Membership";
import { Discount } from "./Discount";
import { decimalTransformer } from "../../util/dataTransform";

@Index("UserID", ["userId"], {})
@Index("MembershipID", ["membershipId"], {})
@Index("DiscountID", ["discountId"], {})
@Entity("Subscribe", { schema: "test_doantotnghiep" })
export class Subscribe {
    @Column("varchar", { primary: true, name: "ID", length: 64 })
    id!: string;

    @Column("int", { name: "UserID" })
    userId!: number;

    @Column("int", { name: "MembershipID" })
    membershipId!: number;

    @Column("int", { name: "DiscountID", nullable: true })
    discountId!: number | null;

    @Column("bigint", { name: "TransID", nullable: true })
    transId!: string | null;

    @Column("decimal", { name: "TotalPrice", precision: 10, scale: 2, transformer: decimalTransformer })
    totalPrice!: number;

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