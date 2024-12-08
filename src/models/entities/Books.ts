import "reflect-metadata";
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Notes } from "./Notes";
import { Authors } from "./Authors";
import { Publisher } from "./Publisher";
import { Orders } from "./Orders";
import { TagsBooks } from "./TagsBooks";
import { Category } from "./Category";
import { User } from "./User";
import { decimalTransformer, bufferTransformer } from "../../util/dataTransform";

@Index("Title", ["title"], {})
@Index("PublisherID", ["publisherId"], {})
@Index("FK_AuthorsID", ["authorsId"], {})
@Entity("Books", { schema: "test_doantotnghiep" })
export class Books {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("varchar", { name: "Title", length: 255 })
    title!: string;

    @Column("text", { name: "Description" })
    description!: string;

    @Column("int", { name: "Rank", default: () => "'1'" })
    rank!: number;

    @Column("int", { name: "PageCount" })
    pageCount!: number;

    @Column("decimal", { name: "Price", precision: 10, scale: 2, transformer: decimalTransformer })
    price!: number;

    @Column("varchar", { name: "file_url", length: 255 })
    fileUrl!: string;

    @Column("varchar", { name: "cover_url", nullable: true, length: 255 })
    coverUrl!: string | null;

    @Column("bit", { name: "status", transformer: bufferTransformer })
    status!: number;

    @Column("int", { name: "AuthorsID" })
    authorsId!: number;

    @Column("int", { name: "PublisherID" })
    publisherId!: number;

    @Column("date", { name: "PublishDate" })
    publishDate!: string;

    @Column("int", {
        name: "IsRecommended",
        nullable: true,
        default: () => "'0'",
    })
    isRecommended!: number | null;

    @OneToMany(() => Notes, (notes) => notes.books)
    notes!: Notes[];

    @ManyToOne(() => Authors, (authors) => authors.books, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "AuthorsID", referencedColumnName: "id" }])
    authors!: Authors;

    @ManyToOne(() => Publisher, (publisher) => publisher.books, {
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn([{ name: "PublisherID", referencedColumnName: "id" }])
    publisher!: Publisher;

    @OneToMany(() => Orders, (orders) => orders.books)
    orders!: Orders[];

    @OneToMany(() => TagsBooks, (tagsBooks) => tagsBooks.books)
    tagsBooks!: TagsBooks[];

    @ManyToMany(() => Category, (category) => category.books)
    categories!: Category[];

    @ManyToMany(() => User, (user) => user.books)
    users!: User[];

    static readonly validSortColumn = Object.freeze(['id', 'title', 'price', 'publisherId', 'authorsId']);
    static readonly SELL: number = 1;
    static readonly MEMBERSHIP: number = 2;

    allowRead(birthYear: number): boolean {
        const currentYear = (new Date()).getFullYear();
        const age = currentYear - birthYear;

        switch (this.rank) {
            case 4:
                if (age > 18) return true;
                else return false;
            case 3:
                if (age > 11) return true;
                else return false;
            case 2:
                if (age > 6) return true;
                else return false;
            default:
                return true;
        }
    }
}
