import { Request, Response } from 'express';
import { Category } from '../models/entities/Category';
import { AppDataSource } from '../models/repository/Datasource';
import { checkReqUser, getValidatedPageInfo, sortValidator } from '../util/checker';

class CategoryController {
    async all(req: Request, res: Response): Promise<void> {
        try {
            const categoryRepository = (await AppDataSource.getInstace()).getRepository(Category);

            const { page, pageSize, offset } = getValidatedPageInfo(req.query);

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

    async find(req: Request, res: Response): Promise<void> {
        try {
            const categoryRepository = (await AppDataSource.getInstace()).getRepository(Category);
            const { name } = req.params;
            const exact = req.query.exact === 'true';
            const detail = req.query.detail === 'true';
    
            if (exact) {
                const category = await categoryRepository.findOne({
                    where: { name },
                    relations: ['books']
                });
    
                if (!category) {
                    res.status(404).json({ message: "Category not found" });
                    return;
                }
    
                if (detail) {
                    const bookCount = category.books.length;
                    const booksDisplay = bookCount > 3
                        ? [...category.books.slice(0, 3), { title: '...more', id: null }]
                        : category.books;
                    res.status(200).json({
                        message: "Category found", data: {
                            id: category.id,
                            name: category.name,
                            booklist: booksDisplay,
                            books: bookCount
                        }
                    });
                } else {
                    res.status(200).json({
                        message: "Category found",
                        data: {
                            id: category.id,
                            name: category.name,
                            books: category.books.length
                        }
                    });
                }
            } else {
                const { page, pageSize, offset } = getValidatedPageInfo(req.query);
    
                const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Category);
    
                const [categories, total] = await categoryRepository.createQueryBuilder("category")
                    .leftJoinAndSelect("category.books", "book")
                    .where("category.name LIKE :name", { name: `%${name}%` })
                    .orderBy(`category.${sort}`, order.toUpperCase() as 'ASC' | 'DESC')
                    .skip(offset).take(pageSize).getManyAndCount();
    
                if (categories.length === 0) {
                    res.status(404).json({ message: "No categories found" });
                    return;
                }
    
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
                        }
                    }
                });
    
                res.status(200).json({ message: "Categories found", data: formattedCategories, total, page, pageSize, warnings });
            }
        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch category(s)", error: error.message });
        }
    }

    async fetch(req: Request, res: Response): Promise<void> {
        try {
            const categoryRepository = (await AppDataSource.getInstace()).getRepository(Category);
            const { id } = req.params;
            const detail = req.query.detail === 'true';
    
            const category = await categoryRepository.findOne({
                where: { id: Number(id) },
                relations: ['books']
            });
    
            if (!category) {
                res.status(404).json({ message: "Category not found" });
                return;
            }
    
            if (detail) {
                const bookCount = category.books.length;
                const booksDisplay = bookCount > 3
                    ? [...category.books.slice(0, 3), { title: '...more', id: null }]
                    : category.books;
                res.status(200).json({
                    message: "Category found", data: {
                        id: category.id,
                        name: category.name,
                        booklist: booksDisplay,
                        books: bookCount
                    }
                });
            } else {
                res.status(200).json({
                    message: "Category found",
                    data: {
                        id: category.id,
                        name: category.name,
                        books: category.books.length
                    }
                });
            }
        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch category", error: error.message });
        }
    }

    async add(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        if (!req.body.categoryName) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        const categoryRepository = (await AppDataSource.getInstace()).getRepository(Category);
        const category = await categoryRepository.findOne({ where: { name: req.body.categoryName } });

        if (category !== null) {
            res.status(409).json({ message: "category already exist", data: category });
            return;
        }

        let newcategory = new Category();
        newcategory.name = req.body.categoryName;
        const toDatabase = categoryRepository.create(newcategory);

        try {
            const savedcategory = await categoryRepository.save(toDatabase);

            res.status(201).json({ message: "Add category success", data: savedcategory });
        } catch (error: any) {
            res.status(500).json({ message: "Failed to add category", error: error });
        }
    }

    async edit(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ message: "Invalid request" });
            return;
        }

        try {
            const categoryRepository = (await AppDataSource.getInstace()).getRepository(Category);

            // Find the category by ID
            const category = await categoryRepository.findOne({ where: { id: Number(id) } });

            if (!category) {
                res.status(404).json({ message: 'Category not found' });
                return;
            }

            // Check for duplicate category name
            const existingCategory = await categoryRepository.findOne({ where: { name } });
            if (existingCategory && existingCategory.id !== category.id) {
                res.status(409).json({ message: 'Category name already exists' });
                return;
            }

            // Update category name
            category.name = name;

            const savedCategory = await categoryRepository.save(category);

            res.status(200).json({ message: 'Category updated successfully', data: savedCategory });
        } catch (error: any) {
            res.status(500).json({ message: 'Failed to update category', error: error.message });
        }
    }
}

export default new CategoryController;
