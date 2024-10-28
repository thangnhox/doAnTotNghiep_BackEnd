import { Router } from 'express';
import AdminController from '../controllers/AdminController';

const admin = Router();

admin.post('/login', (req, res) => AdminController.login(req, res));

export default admin;