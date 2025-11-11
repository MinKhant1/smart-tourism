import { Router } from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';
import { createTrip, myTrips, getTrip, itinerariesByTrip, planTextForTrip, chatForTrip } from '../controllers/trips.controller.js';

const router = Router();

const createSchema = z.object({
  name: z.string(),
  city: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  preferences: z.any().optional()
});

router.post('/', auth, validate(createSchema), createTrip);
router.get('/mine', auth, myTrips);
router.get('/:id', auth, getTrip);
router.get('/:id/itineraries', auth, itinerariesByTrip);
router.post('/:id/plan-text', auth, planTextForTrip);
router.post('/:id/chat', auth, chatForTrip);

export default router;