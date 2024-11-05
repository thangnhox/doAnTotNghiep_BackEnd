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

  @Column("int", { name: "PageCount" })
  pageCount!: number;

  @Column("decimal", { name: "Price", precision: 10, scale: 2 })
  price!: string;

  @Column("varchar", { name: "file_url", length: 255 })
  fileUrl!: string;

  @Column("varchar", { name: "cover_url", nullable: true, length: 255 })
  coverUrl!: string | null;

  @Column("bit", { name: "status" })
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
}
