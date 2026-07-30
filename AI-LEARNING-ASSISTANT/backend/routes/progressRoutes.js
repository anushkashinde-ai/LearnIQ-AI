import express from 'express';
import {
    getDashboard,
} from '../controller/progressController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);

export default router;