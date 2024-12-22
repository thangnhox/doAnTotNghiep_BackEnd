import { Router } from 'express';
import UserController from '../controllers/UserController';
import { authenticateJWT } from '../services/authentication';

const user = Router();

user.get('/verify/:token', (req, res) => UserController.validateUser(req, res));
user.get('/info', authenticateJWT, (req, res) => UserController.info(req, res));

user.post('/resetPassword', (req, res) => UserController.resetPassword(req, res));
user.post('/google', (req, res) => UserController.googleLogin(req, res));
user.post('/login', (req, res) => UserController.login(req, res));
user.post('/createUser', (req, res) => UserController.createUser(req, res));
user.post('/resetPassword/:token', (req, res) => UserController.confirmResetPassword(req, res));

user.put('/update', authenticateJWT, (req, res) => UserController.updateInfo(req, res));

export default user;
