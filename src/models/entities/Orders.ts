import "reflect-metadata";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Books } from "./Books";
import { Bill } from "./Bill";

@Index("BooksID", ["booksId"], {})
@Index("BillID", ["billId"], {})
@Entity("Orders", { schema: "test_doantotnghiep" })
export class Orders {
    @Column("int", { primary: true, name: "UserID" })
    userId!: number;

    @Column("int", { primary: true, name: "BooksID" })
    booksId!: number;

	@Column("varchar", { name: "BillID", nullable: true, length: 64 })
	billId!: string | null;

    @ManyToOne(() => User, (user) => user.orders, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "UserID", referencedColumnName: "id" }])
    user!: User;

    @ManyToOne(() => Books, (books) => books.orders, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "BooksID", referencedColumnName: "id" }])
    books!: Books;

    @ManyToOne(() => Bill, (bill) => bill.orders, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "BillID", referencedColumnName: "id" }])
    bill!: Bill;

    static readonly validSortColumn = Object.freeze(['userId', 'date', 'totalPrice']);
}
