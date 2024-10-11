import { Request, Response } from 'express';
import { Category } from '../models/entities/Category';
import { createAppDataSource } from '../models/repository/Datasource';

class CategoryController {
    async all(req: Request, res: Response): Promise<void> {
        const AppDataSource = createAppDataSource();
        try {
            await AppDataSource.initialize();
            const categoryRepository = AppDataSource.getRepository(Category);
            const categories = await categoryRepository.find();
            res.status(200).json({ message: "fetch success", data: categories });
        } catch (error: any) {
            res.status(500).json({ message: "failed to fetch categories", error: error.message });
        }
    }
}

export default new CategoryController();
