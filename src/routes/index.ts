import { Router } from 'express';
import IndexController from '../controllers/IndexController';

const index = Router();

index.get('/', IndexController.index);

export default index;
