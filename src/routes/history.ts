import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import ReadHistoryController from '../controllers/ReadHistoryController';

const history = Router();

history.get('/', authenticateJWT, (req, res) => ReadHistoryController.all(req, res));
history.get('/get/:id', authenticateJWT, (req, res) => ReadHistoryController.getProgress(req, res));
history.get('/update/:id/:page', authenticateJWT, (req, res) => ReadHistoryController.updateProgress(req, res));
history.get('/remove/:id', authenticateJWT, (req, res) => ReadHistoryController.removeHistory(req, res));

export default history;