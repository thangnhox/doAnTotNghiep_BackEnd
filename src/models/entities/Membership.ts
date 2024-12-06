import "reflect-metadata";
import {
    Column,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Subscribe } from "./Subscribe";
import { MembershipRecord } from "./MembershipRecord";
import { decimalTransformer, bufferTransformer } from "../../util/dataTransform";

@Index("Name", ["name"], { unique: true })
@Entity("Membership", { schema: "test_doantotnghiep" })
export class Membership {
    @PrimaryGeneratedColumn({ type: "int", name: "ID" })
    id!: number;

    @Column("varchar", { name: "Name", unique: true, length: 255 })
    name!: string;

    @Column("int", { name: "Rank" })
    rank!: number;

    @Column("bit", { name: "AllowNew", transformer: bufferTransformer })
    allowNew!: number;

    @Column("decimal", { name: "Price", precision: 10, scale: 2, transformer: decimalTransformer })
    price!: number;

    @OneToMany(() => Subscribe, (subscribe) => subscribe.membership)
    subscribes!: Subscribe[];

    @OneToMany(
        () => MembershipRecord,
        (membershipRecord) => membershipRecord.membership
    )
    membershipRecords!: MembershipRecord[];

    static readonly validSortColumn = Object.freeze(['id', 'name', 'price']);
}
