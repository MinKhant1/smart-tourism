import { Router } from 'express';
import { searchCities } from '../controllers/cities.controller.js';

const router = Router();

router.get('/search', searchCities);

export default router;