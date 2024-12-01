import { Router } from 'express';
import AuthorsController from '../controllers/AuthorsController';
import { authenticateJWT } from '../services/authentication';

const authors = Router();

authors.post('/add', authenticateJWT, (req, res) => AuthorsController.addAuthor(req, res));
authors.get('/find', (req, res) => AuthorsController.find(req, res));
authors.post('/edit/:id', authenticateJWT, (req, res) => AuthorsController.editAuthor(req, res));
authors.get('/info/:id', (req, res) => AuthorsController.getAuthorInfo(req, res));
authors.get('/', (req, res) => AuthorsController.all(req, res));

export default authors;