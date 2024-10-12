import "reflect-metadata";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Books } from "./Books";

@Entity("Publisher", { schema: "test_doantotnghiep" })
export class Publisher {
  @PrimaryGeneratedColumn({ type: "int", name: "ID" })
  id!: number;

  @Column("varchar", { name: "Name", length: 255 })
  name!: string;

  @OneToMany(() => Books, (books) => books.publisher)
  books!: Books[];
}
