import { Router } from 'express';
import { planTrip, myItineraries } from '../controllers/itineraries.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const planSchema = z.object({
  city: z.string(),
  country: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  partySize: z.number().int().positive().optional(),
  preferences: z.any().optional()
});

router.post('/plan', auth, validate(planSchema), planTrip);
router.get('/mine', auth, myItineraries);

export default router;
