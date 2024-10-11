import "reflect-metadata";
import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { Books } from "./Books";

@Entity("Category", { schema: "test_doantotnghiep" })
export class Category {
  @Column("varchar", { primary: true, name: "ID", length: 255 })
  id!: string;

  @Column("varchar", { name: "Name", length: 255 })
  name!: string;

  @ManyToMany(() => Books, (books) => books.categories)
  @JoinTable({
    name: "Book_Category",
    joinColumns: [{ name: "CategoryID", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "BooksID", referencedColumnName: "id" }],
    schema: "test_doantotnghiep",
  })
  books!: Books[];
}
