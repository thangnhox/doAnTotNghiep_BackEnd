import { Router } from 'express';
import CategoryController from '../controllers/CategoryController';
import { authenticateJWT } from '../services/authentication';

const category = Router();

category.get('/', authenticateJWT, (req, res) => CategoryController.all(req, res));

export default category;
