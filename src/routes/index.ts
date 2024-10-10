import { Router } from 'express';
import dataController from '../controllers/dataController';

const router = Router();

router.get('/data', dataController.getData);
router.post('/data', dataController.postData);
router.put('/data/:id', dataController.putData);
router.delete('/data/:id', dataController.deleteData);

export default router;
