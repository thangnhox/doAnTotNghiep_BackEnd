import { Router } from 'express';
import CategoryController from '../controllers/CategoryController';
import { authenticateJWT } from '../services/authentication';

const category = Router();

category.get('/find/:name', (req, res) => CategoryController.find(req, res));
category.get('/fetch/:id', (req, res) => CategoryController.fetch(req, res));
category.post('/add', authenticateJWT, (req, res) => CategoryController.add(req, res));
category.get('/', (req, res) => CategoryController.all(req, res));

export default category;
