import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import TagsController from '../controllers/TagsController';

const tags = Router();

tags.get('/', authenticateJWT, (req, res) => TagsController.all(req, res));
tags.get('/fetch/:id', authenticateJWT, (req, res) => TagsController.fetch(req, res));
tags.get('/attach/:id', authenticateJWT, (req, res) => TagsController.attach(req, res));
tags.get('/detach/:id', authenticateJWT, (req, res) => TagsController.detach(req, res));
tags.get('/remove/:id', authenticateJWT, (req, res) => TagsController.remove(req, res));
tags.get('/add', authenticateJWT, (req, res) => TagsController.add(req, res));
tags.get('/rename', authenticateJWT, (req, res) => TagsController.rename(req, res));

export default tags;