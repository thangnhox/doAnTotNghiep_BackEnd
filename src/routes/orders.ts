import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import OrdersController from '../controllers/OrdersController';

const orders = Router();

orders.get('/check/:bookId', authenticateJWT, (req, res) => OrdersController.checkPurcharged(req, res));

export default orders;