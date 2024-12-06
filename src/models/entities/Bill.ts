import "reflect-metadata";
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Discount } from "./Discount";
import { Orders } from "./Orders";
import { decimalTransformer } from "../../util/dataTransform";

@Index("UserID", ["userId"], {})
@Index("DiscountID", ["discountId"], {})
@Entity("Bill", { schema: "test_doantotnghiep" })
export class Bill {
	@Column("varchar", { primary: true, name: "ID", length: 64 })
	id!: string;

	@Column("int", { name: "UserID" })
	userId!: number;

	@Column("int", { name: "DiscountID", nullable: true })
	discountId!: number | null;

	@Column("decimal", { name: "TotalPrice", precision: 10, scale: 2, transformer: decimalTransformer })
	totalPrice!: number;

	@Column("date", { name: "CreateDate" })
	createDate!: string;

	@Column("date", { name: "PaymentDate", nullable: true })
	paymentDate!: string | null;

	@ManyToOne(() => User, (user) => user.bills, {
		onDelete: "RESTRICT",
		onUpdate: "RESTRICT",
	})
	@JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
	user!: User;

	@ManyToOne(() => Discount, (discount) => discount.bills, {
		onDelete: "RESTRICT",
		onUpdate: "RESTRICT",
	})
	@JoinColumn([{ name: "DiscountID", referencedColumnName: "id" }])
	discount!: Discount;

	@OneToMany(() => Orders, (orders) => orders.bill)
	orders!: Orders[];
}
