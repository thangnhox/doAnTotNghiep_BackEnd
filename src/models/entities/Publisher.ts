import { Column, Entity, OneToMany } from "typeorm";
import { Publishing } from "./Publishing";

@Entity("Publisher", { schema: "test_doantotnghiep" })
export class Publisher {
  @Column("varchar", { primary: true, name: "ID", length: 255 })
  id: string;

  @Column("varchar", { name: "Name", length: 255 })
  name: string;

  @OneToMany(() => Publishing, (publishing) => publishing.publisher)
  publishings: Publishing[];
}
