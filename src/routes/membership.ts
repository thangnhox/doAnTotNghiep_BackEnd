import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import MembershipController from '../controllers/MembershipController';

const membership = Router();

membership.post('/initSubscription', authenticateJWT, (req, res) => MembershipController.initSubscription(req, res));
membership.post('/confSubscription', (req, res) => MembershipController.paymentConfirm(req, res));
membership.post('/edit/:id', authenticateJWT, (req, res) => MembershipController.editMembership(req, res));
membership.post('/add', authenticateJWT, (req, res) => MembershipController.insertMembership(req, res));
membership.post('/subscribe', authenticateJWT, (req, res) => MembershipController.create(req, res));
membership.post('/confirm', (req, res) => MembershipController.confirm(req, res));

membership.get('/hide/:id', authenticateJWT, (req, res) => MembershipController.hideMembership(req, res));
membership.get('/check', authenticateJWT, (req, res) => MembershipController.checkMembership(req, res));
membership.get('/cancel', authenticateJWT, (req, res) => MembershipController.cancelMembership(req, res));
membership.get('/', (req, res) => MembershipController.all(req, res));

export default membership;
