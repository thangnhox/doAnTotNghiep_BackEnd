import { Request, Response } from 'express';
import { Category } from '../models/entities/Category';
import { AppDataSource } from '../models/repository/Datasource';
import { orderChecker, sortValidator } from '../util/checker';

class CategoryController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const categoryRepository = (await AppDataSource.getInstace()).getRepository(Category);

            const page = parseInt(req.query.page as string, 10) || 1;
            const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
            const offset = (page - 1) * pageSize;

            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Category);

            const [categories, total] = await categoryRepository.findAndCount({
                relations: ['books'],
                take: pageSize,
                skip: offset,
                order: {
                    [sort]: order.toUpperCase() as 'ASC' | 'DESC'
                }
            });

            const detail = req.query.detail === 'true';

            const formattedCategories = categories.map(category => {
                if (detail) {
                    const bookCount = category.books.length;
                    const booksDisplay = bookCount > 3
                        ? [...category.books.slice(0, 3), { title: '...more', id: null }]
                        : category.books;
                    return {
                        id: category.id,
                        name: category.name,
                        booklist: booksDisplay,
                        books: bookCount
                    };
                } else {
                    return {
                        id: category.id,
                        name: category.name,
                        books: category.books.length
                    };
                }
            });

            res.status(200).json({ 
                message: "fetch success",
                data: formattedCategories,
                total,
                page,
                pageSize,
                warnings
            });
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch categories", error: error.message });
        }
    }
}

export default new CategoryController;
