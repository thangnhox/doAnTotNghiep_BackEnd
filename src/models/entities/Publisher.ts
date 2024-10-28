import "reflect-metadata";
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Books } from "./Books";

@Index("Name", ["name"], { unique: true })
@Entity("Publisher", { schema: "test_doantotnghiep" })
export class Publisher {
  @PrimaryGeneratedColumn({ type: "int", name: "ID" })
  id!: number;

  @Column("varchar", { name: "Name", unique: true, length: 255 })
  name!: string;

  @OneToMany(() => Books, (books) => books.publisher)
  books!: Books[];
}
