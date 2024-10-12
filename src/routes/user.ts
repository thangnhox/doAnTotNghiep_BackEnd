import { Router } from 'express';
import UserController from '../controllers/UserController';

const user = Router();

user.post('/login', (req, res) => UserController.login(req, res));
user.post('/createUser', (req, res) => UserController.createUser(req, res));

export default user;