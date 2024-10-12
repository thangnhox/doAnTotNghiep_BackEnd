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
import { Publisher } from "./Publisher";
import { Membership } from "./Membership";
import { Orders } from "./Orders";
import { Notes } from "./Notes";
import { Category } from "./Category";
import { User } from "./User";

@Index("Title", ["title"], {})
@Index("PublisherID", ["publisherId"], {})
@Entity("Books", { schema: "test_doantotnghiep" })
export class Books {
  @PrimaryGeneratedColumn({ type: "int", name: "ID" })
  id!: number;

  @Column("varchar", { name: "Title", length: 255 })
  title!: string;

  @Column("decimal", { name: "Price", precision: 10, scale: 2 })
  price!: string;

  @Column("varchar", { name: "file_url", length: 255 })
  fileUrl!: string;

  @Column("varchar", { name: "cover_url", nullable: true, length: 255 })
  coverUrl!: string | null;

  @Column("bit", { name: "status" })
  status!: number;

  @Column("int", { name: "PublisherID" })
  publisherId!: number;

  @Column("int", {
    name: "IsRecommended",
    nullable: true,
    default: () => "'0'",
  })
  isRecommended!: number | null;

  @ManyToOne(() => Publisher, (publisher) => publisher.books, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "PublisherID", referencedColumnName: "id" }])
  publisher!: Publisher;

  @ManyToMany(() => Membership, (membership) => membership.books)
  memberships!: Membership[];

  @OneToMany(() => Orders, (orders) => orders.books)
  orders!: Orders[];

  @OneToMany(() => Notes, (notes) => notes.books)
  notes!: Notes[];

  @ManyToMany(() => Category, (category) => category.books)
  categories!: Category[];

  @ManyToMany(() => User, (user) => user.books)
  users!: User[];
}
