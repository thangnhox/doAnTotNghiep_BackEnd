import { Router } from 'express';
import PublisherController from '../controllers/PublisherController';
import { authenticateJWT } from '../services/authentication';

const publisher = Router();

publisher.post('/add', authenticateJWT, (req, res) => PublisherController.add(req, res));
publisher.get('/', (req, res) => PublisherController.all(req, res));

export default publisher;