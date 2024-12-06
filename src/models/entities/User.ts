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
import { Notes } from "./Notes";
import { Tags } from "./Tags";
import { Orders } from "./Orders";
import { Subscribe } from "./Subscribe";
import { Discount } from "./Discount";
import { MembershipRecord } from "./MembershipRecord";
import { Books } from "./Books";
import { BookRequest } from "./BookRequest";
import { Bill } from "./Bill";

@Index("Email", ["email"], { unique: true })
@Entity("User", { schema: "test_doantotnghiep" })
export class User {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("varchar", { name: "Email", unique: true, length: 255 })
    email!: string;

    @Column("varchar", { name: "password", length: 255 })
    password!: string;

    @Column("varchar", { name: "Name", length: 255 })
    name!: string;

    @Column("int", { name: "BirthYear" })
    birthYear!: number | null;

    @Column("varchar", { name: "Avatar", nullable: true, length: 255 })
    avatar!: string | null;

    @Column("tinyint", { name: "isAdmin", width: 1, default: () => "'0'" })
    isAdmin!: number;

	@OneToMany(() => Bill, (bill) => bill.user)
	bills!: Bill[];

    @OneToMany(() => Notes, (notes) => notes.user)
    notes!: Notes[];

    @OneToMany(() => Tags, (tags) => tags.user)
    tags!: Tags[];

    @OneToMany(() => Orders, (orders) => orders.user)
    orders!: Orders[];

    @OneToMany(() => Subscribe, (subscribe) => subscribe.user)
    subscribes!: Subscribe[];

    @ManyToMany(() => Discount, (discount) => discount.users)
    discounts!: Discount[];

    @OneToMany(
        () => MembershipRecord,
        (membershipRecord) => membershipRecord.user
    )
    membershipRecords!: MembershipRecord[];

    @ManyToMany(() => Books, (books) => books.users)
    @JoinTable({
        name: "Likes",
        joinColumns: [{ name: "UserID", referencedColumnName: "id" }],
        inverseJoinColumns: [{ name: "BooksID", referencedColumnName: "id" }],
        schema: "test_doantotnghiep",
    })
    books!: Books[];

    @OneToMany(() => BookRequest, (bookRequest) => bookRequest.user)
    bookRequests!: BookRequest[];

    static readonly validSortColumn = Object.freeze(['id', 'name']);
}
