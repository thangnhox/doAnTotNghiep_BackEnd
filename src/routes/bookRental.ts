import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import BookRetalController from '../controllers/BookRetalController';

const bookRental = Router();

bookRental.post('/rent', authenticateJWT, (req, res) => BookRetalController.rent(req, res));
bookRental.post('/confirm', (req, res) => BookRetalController.confirm(req, res));

bookRental.get('/', authenticateJWT, (req, res) => BookRetalController.rentedBooks(req, res));
bookRental.get('/check/:id', authenticateJWT, (req, res) => BookRetalController.check(req, res));

export default bookRental;