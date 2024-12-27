import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import DiscountController from '../controllers/DiscountController';

const discount = Router();

discount.post('/add', authenticateJWT, (req, res) => DiscountController.insertDiscount(req, res));
discount.post('/edit/:id', authenticateJWT, (req, res) => DiscountController.editDiscount(req, res));
discount.get('/hide/:id', authenticateJWT, (req, res) => DiscountController.hideDiscount(req, res));
discount.get('/search', (req, res) => DiscountController.search(req, res));
discount.get('/fetch/:name', (req, res) => DiscountController.fetch(req, res));
discount.get('/', authenticateJWT, (req, res) => DiscountController.all(req, res));

export default discount;