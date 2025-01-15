import { Router } from 'express';
import BooksController from '../controllers/BooksController';
import { authenticateJWT } from '../services/authentication';

const books = Router();

books.post('/add', authenticateJWT, (req, res) => BooksController.add(req, res));
books.post('/edit/:id', authenticateJWT, (req, res) => BooksController.edit(req, res));
books.post('/makeBookRequest', authenticateJWT, (req, res) => BooksController.makeBookRequest(req, res));
books.post('/editBookRequest/:id', authenticateJWT, (req, res) => BooksController.editBookRequest(req, res));
books.post('/cancelBookRequest/:id', authenticateJWT, (req, res) => BooksController.cancelBookRequest(req, res));

books.get('/read/:id', authenticateJWT , (req, res) => BooksController.read(req, res));
books.get('/fetch/:id', (req, res) => BooksController.fetch(req, res));
books.get('/download/:id', authenticateJWT, (req, res) => BooksController.downloadPDF(req, res));
books.get('/like/:id', authenticateJWT, (req, res) => BooksController.like(req, res));
books.get('/search', (req, res) => BooksController.search(req, res));
books.get('/liked/:id', authenticateJWT, (req, res) => BooksController.liked(req, res));
books.get('/liked', authenticateJWT, (req, res) => BooksController.liked(req, res));
books.get('/requestedBooks', authenticateJWT, (req, res) => BooksController.requestedBooks(req, res));
books.get('/requestedBooks/:id', authenticateJWT, (req, res) => BooksController.requestedBooksDetail(req, res));
books.get('/', (req, res) => BooksController.all(req, res));

export default books;