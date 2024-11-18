import { Router } from 'express';
import BooksController from '../controllers/BooksController';
import { authenticateJWT } from '../services/authentication';

const books = Router();

books.post('/add', authenticateJWT, (req, res) => BooksController.add(req, res));
books.get('/read/:id', authenticateJWT , (req, res) => BooksController.read(req, res));
books.get('/fetch/:id', (req, res) => BooksController.fetch(req, res));
books.get('/', (req, res) => BooksController.all(req, res));

export default books;