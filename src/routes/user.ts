import { Router } from 'express';
import UserController from '../controllers/UserController';
import { authenticateJWT } from '../services/authentication';

const user = Router();

user.post('/login', (req, res) => UserController.login(req, res));
user.post('/createUser', (req, res) => UserController.createUser(req, res));
user.get('/verify/:token', (req, res) => UserController.validateUser(req, res));
user.post('/google', (req, res) => UserController.googleLogin(req, res));
user.get('/info', authenticateJWT, (req, res) => UserController.info(req, res));

export default user;
