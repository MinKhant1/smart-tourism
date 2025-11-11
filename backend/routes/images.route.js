import { Router } from 'express';
import { cityImage } from '../controllers/images.controller.js';

const router = Router();

// GET /api/images/city?name=Bangkok&w=900&h=600
router.get('/city', cityImage);

export default router;