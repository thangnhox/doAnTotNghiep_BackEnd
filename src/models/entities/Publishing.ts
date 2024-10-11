import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Books } from "./Books";
import { Publisher } from "./Publisher";

@Index("PublisherID", ["publisherId"], {})
@Entity("Publishing", { schema: "test_doantotnghiep" })
export class Publishing {
  @Column("varchar", { primary: true, name: "BooksID", length: 255 })
  booksId: string;

  @Column("varchar", { primary: true, name: "PublisherID", length: 255 })
  publisherId: string;

  @Column("date", { name: "Date" })
  date: string;

  @ManyToOne(() => Books, (books) => books.publishings, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "BooksID", referencedColumnName: "id" }])
  books: Books;

  @ManyToOne(() => Publisher, (publisher) => publisher.publishings, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "PublisherID", referencedColumnName: "id" }])
  publisher: Publisher;
}
