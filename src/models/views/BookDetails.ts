import "reflect-metadata";
import { ViewEntity, ViewColumn } from "typeorm";

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
    file_url!: string;

    @ViewColumn()
    cover_url!: string;

    @ViewColumn()
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

    @ViewColumn()
    LikesCount!: number;

    static readonly validSortColumn = Object.freeze([
        'BookID', 'Title', 'Description', 'PageCount', 'Price',
        'file_url', 'cover_url', 'status', 'PublishDate',
        'IsRecommended', 'PublisherName', 'AuthorName',
        'Categories', 'LikesCount'
    ]);
}
