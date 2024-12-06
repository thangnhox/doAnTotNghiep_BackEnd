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
import { Bill } from "./Bill";
import { Subscribe } from "./Subscribe";
import { User } from "./User";

@Index("Name", ["name"], { unique: true })
@Entity("Discount", { schema: "test_doantotnghiep" })
export class Discount {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("varchar", { name: "Name", unique: true, length: 255 })
    name!: string;

    @Column("float", { name: "Ratio", precision: 12 })
    ratio!: number;

    @Column("date", { name: "Expire_date" })
    expireDate!: string;

    @Column("bit", { name: "Status" })
    status!: number;

    @OneToMany(() => Bill, (bill) => bill.discount)
    bills!: Bill[];

    @OneToMany(() => Subscribe, (subscribe) => subscribe.discount)
    subscribes!: Subscribe[];

    @ManyToMany(() => User, (user) => user.discounts)
    @JoinTable({
        name: "Used",
        joinColumns: [{ name: "DiscountID", referencedColumnName: "id" }],
        inverseJoinColumns: [{ name: "UserID", referencedColumnName: "id" }],
        schema: "test_doantotnghiep",
    })
    users!: User[];

    static readonly validSortColumn = Object.freeze(['id', 'name', 'ratio']);
}
