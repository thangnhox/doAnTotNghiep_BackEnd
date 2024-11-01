import { Router } from 'express';
import PublisherController from '../controllers/PublisherController';
import { authenticateJWT } from '../services/authentication';

const publisher = Router();

publisher.post('/add', authenticateJWT, (req, res) => PublisherController.add(req, res));
publisher.get('/find/:name', (req, res) => PublisherController.findPublisher(req, res));
publisher.get('/fetch/:id', (req, res) => PublisherController.fetch(req, res));
publisher.get('/', (req, res) => PublisherController.all(req, res));

export default publisher;