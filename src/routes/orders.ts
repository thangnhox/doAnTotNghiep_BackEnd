import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import OrdersController from '../controllers/OrdersController';

const orders = Router();

orders.get('/check/:bookId', authenticateJWT, (req, res) => OrdersController.checkPurcharged(req, res));
orders.post('/create', authenticateJWT, (req, res) => OrdersController.create(req, res));
orders.post('/confirm', (req, res) => OrdersController.paymentResult(req, res));

export default orders;
