import "reflect-metadata";
import { Column, Entity, ManyToMany } from "typeorm";
import { Books } from "./Books";
import { Membership } from "./Membership";

@Entity("Discount", { schema: "test_doantotnghiep" })
export class Discount {
  @Column("varchar", { primary: true, name: "ID", length: 255 })
  id!: string;

  @Column("varchar", { name: "Name", length: 255 })
  name!: string;

  @Column("date", { name: "Expire_date" })
  expireDate!: string;

  @Column("bit", { name: "Status" })
  status!: number;

  @ManyToMany(() => Books, (books) => books.discounts)
  books!: Books[];

  @ManyToMany(() => Membership, (membership) => membership.discounts)
  memberships!: Membership[];
}
