import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import NotesController from '../controllers/NotesController';

const notes = Router();

notes.get('/', authenticateJWT, (req, res) => NotesController.all(req, res));
notes.get('/fetch/:id', authenticateJWT, (req, res) => NotesController.fetch(req, res));
notes.get('/search', authenticateJWT, (req, res) => NotesController.search(req, res));
notes.get('/remove/:id', authenticateJWT, (req, res) => NotesController.remove(req, res));

notes.post('/add', authenticateJWT, (req, res) => NotesController.add(req, res));

notes.put('/edit/:id', authenticateJWT, (req, res) => NotesController.edit(req, res));

export default notes;