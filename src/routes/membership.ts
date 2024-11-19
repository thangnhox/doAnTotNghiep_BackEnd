import { Router } from 'express';
import { authenticateJWT } from '../services/authentication';
import MembershipController from '../controllers/MembershipController';

const membership = Router();

membership.get('/check', authenticateJWT, (req, res) => MembershipController.checkMembership(req, res));

export default membership;