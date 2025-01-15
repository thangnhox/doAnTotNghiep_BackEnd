import { Router } from 'express';
import AdminController from '../controllers/AdminController';
import { authenticateJWT } from '../services/authentication';

const admin = Router();

admin.post('/login', (req, res) => AdminController.login(req, res));
admin.post('/changePassword', authenticateJWT, (req, res) => AdminController.changePassword(req, res));

admin.get('/soldBooks', authenticateJWT, (req, res) => AdminController.soldBooks(req, res));
admin.get('/booksStatistic', authenticateJWT, (req, res) => AdminController.bookStatistic(req, res));
admin.get('/membershipStatistic', authenticateJWT, (req, res) => AdminController.membershipStatistic(req, res));
admin.get('/membershipIncome', authenticateJWT, (req, res) => AdminController.membershipIncome(req, res));
admin.get('/userStatistic', authenticateJWT, (req, res) => AdminController.getUserAgeGroupStatistics(req, res));

admin.get('/requestedBooks', authenticateJWT, (req, res) => AdminController.requestedBooks(req, res));
admin.get('/requestedBooks/:id', authenticateJWT, (req, res) => AdminController.requestedBooksDetail(req, res));
admin.get('/searchRequest', authenticateJWT, (req, res) => AdminController.searchRequest(req, res));
admin.get('/confirmBookrequest/:id', authenticateJWT, (req, res) => AdminController.confirmBookrequest(req, res));

export default admin;