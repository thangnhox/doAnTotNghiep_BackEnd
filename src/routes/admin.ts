import { Router } from 'express';
import AdminController from '../controllers/AdminController';
import { authenticateJWT } from '../services/authentication';

const admin = Router();

admin.post('/login', (req, res) => AdminController.login(req, res));
admin.post('/changePassword', authenticateJWT, (req, res) => AdminController.changePassword(req, res));

export default admin;