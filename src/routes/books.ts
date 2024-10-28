import { Router } from 'express';
import BooksController from '../controllers/BooksController';
import { authenticateJWT } from '../services/authentication';

const books = Router();

books.post('/add', authenticateJWT, (req, res) => BooksController.add(req, res));
books.get('/', (req, res) => BooksController.all(req, res));

export default books;