import { Router } from 'express';
import { planTripFromText } from '../controllers/itineraryText.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = Router();

// Use auth if you want to save; you can remove auth to allow public generation
router.post('/plan-text', /* auth, */ planTripFromText);

export default router;
