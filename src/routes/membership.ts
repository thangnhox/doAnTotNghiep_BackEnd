import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import MembershipController from '../controllers/MembershipController';

const membership = Router();

membership.get('/check', authenticateJWT, (req, res) => MembershipController.checkMembership(req, res));
membership.post('/add', authenticateJWT, (req, res) => MembershipController.insertMembership(req, res));
membership.post('/edit/:id', authenticateJWT, (req, res) => MembershipController.editMembership(req, res));
membership.get('/hide/:id', authenticateJWT, (req, res) => MembershipController.hideMembership(req, res));

export default membership;