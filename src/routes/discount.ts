import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import DiscountController from '../controllers/DiscountController';

const discount = Router();

discount.post('/add', authenticateJWT, (req, res) => DiscountController.insertDiscount(req, res));
discount.post('/edit/:id', authenticateJWT, (req, res) => DiscountController.editDiscount(req, res));
discount.get('/hide/:id', authenticateJWT, (req, res) => DiscountController.hideDiscount(req, res));

export default discount;