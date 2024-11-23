import { Router } from 'express';
import UserController from '../controllers/UserController';

const user = Router();

user.post('/login', (req, res) => UserController.login(req, res));
user.post('/createUser', (req, res) => UserController.createUser(req, res));
user.get('/verify/:token', (req, res) => UserController.validateUser(req, res));
user.get('/google', (req, res) => UserController.googleLogin(req, res));

export default user;