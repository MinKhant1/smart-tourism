import { z } from 'zod';
import { Trip } from '../models/trip.model.js';
import { Itinerary } from '../models/itineraries.model.js';
import { planTripFromText as planTextController } from './itineraryText.controller.js';

const createSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  preferences: z.any().optional()
});

export const createTrip = async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const doc = await Trip.create({ userId: req.userId, ...body });
    res.status(201).json({ trip: doc });
  } catch (err) {
    next(err);
  }
};

export const myTrips = async (req, res, next) => {
  try {
    const list = await Trip.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ items: list });
  } catch (err) {
    next(err);
  }
};

export const getTrip = async (req, res, next) => {
  try {
    const doc = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!doc) return res.status(404).json({ message: 'Trip not found' });
    res.json({ trip: doc });
  } catch (err) {
    next(err);
  }
};

export const itinerariesByTrip = async (req, res, next) => {
  try {
    const items = await Itinerary.find({ userId: req.userId, tripId: req.params.id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

// Wrap text planning to force save to this trip
export const planTextForTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Use trip data as defaults so user doesn't need to re-enter
    const defaults = {
      defaultCity: trip.city,
      defaultCountry: 'Thailand', // adjust if you add country to Trip
      defaultPartySize: 2,
      startDate: trip.startDate,
      endDate: trip.endDate,
    };

    req.body = { ...req.body, ...defaults, save: true };
    return planTextController(req, res, next);
  } catch (err) {
    next(err);
  }
};