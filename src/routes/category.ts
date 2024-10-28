import { Router } from 'express';
import CategoryController from '../controllers/CategoryController';

const category = Router();

category.get('/', (req, res) => CategoryController.all(req, res));

export default category;
