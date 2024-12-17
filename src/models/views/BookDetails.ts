import "reflect-metadata";
import { ViewEntity, ViewColumn } from "typeorm";
import { bufferTransformer, decimalTransformer } from "../../util/dataTransform";

@ViewEntity({ schema: "test_doantotnghiep", name: "BookDetails" })
export class BookDetails {
    @ViewColumn()
    BookID!: number;

    @ViewColumn()
    Title!: string;

    @ViewColumn()
    Description!: string;

    @ViewColumn()
    PageCount!: number;

    @ViewColumn()
    Price!: number;

    @ViewColumn()
    rank!: number;

    @ViewColumn()
    cover_url!: string;

    @ViewColumn({ transformer: bufferTransformer })
    status!: number;

    @ViewColumn()
    PublishDate!: Date;

    @ViewColumn()
    IsRecommended!: number;

    @ViewColumn()
    PublisherName!: string;

    @ViewColumn()
    AuthorName!: string;

    @ViewColumn()
    Categories!: string;

    @ViewColumn({ transformer: decimalTransformer })
    LikesCount!: number;

    static readonly validSortColumn = Object.freeze([
        'BookID', 'Title', 'Description', 'PageCount', 'Price',
        'rank', 'cover_url', 'status', 'PublishDate',
        'IsRecommended', 'PublisherName', 'AuthorName',
        'Categories', 'LikesCount'
    ]);
}
