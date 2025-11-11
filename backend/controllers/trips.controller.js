import { z } from 'zod';
import { Trip } from '../models/trip.model.js';
import mongoose from 'mongoose';
import { Itinerary } from '../models/itineraries.model.js';
import { planTripFromText as planTextController } from './itineraryText.controller.js';
import { askPerplexity } from '../lib/perplexity.js';

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
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid trip id' });
    }
    const trip = await Trip.findOne({ _id: id, userId: req.userId });
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
    console.log('[Trips] plan-text for trip', { tripId: id, defaults, hasQuery: typeof req.body?.query === 'string' });
    return planTextController(req, res, next);
  } catch (err) {
    console.error('[Trips] plan-text error', err);
    next(err);
  }
};

// Chat about the trip (non-itinerary). Uses LLM to answer questions with trip context.
const chatSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      })
    )
    .optional(),
});

export const chatForTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid trip id' });
    }
    const { message, history = [] } = chatSchema.parse(req.body);

    const trip = await Trip.findOne({ _id: id, userId: req.userId });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const system = {
      role: 'system',
      content:
        `You are a helpful travel assistant. Answer questions about the user's trip. Do not create or save itineraries in chat. Keep responses concise, actionable, and tailored to the trip context. Currency is THB. If asked to generate a full itinerary, politely suggest using the "New Itinerary with AI" button instead.\n\nTrip context:\nCity: ${trip.city}\nStart: ${trip.startDate}\nEnd: ${trip.endDate}\nPreferences: ${JSON.stringify(trip.preferences || {})}`,
    };

    const userMsg = { role: 'user', content: message };
    // Map provided history and normalize to alternate roles starting with user
    const historyMsgsRaw = Array.isArray(history)
      ? history.map((m) => ({ role: m.role, content: m.content }))
      : [];

    const normalizeThread = (thread) => {
      const out = [];
      for (const m of thread) {
        if (!m || typeof m.content !== 'string' || !m.role) continue;
        if (out.length && out[out.length - 1].role === m.role) {
          // Replace previous same-role message with the newer one
          out[out.length - 1] = m;
        } else {
          out.push(m);
        }
      }
      // Ensure conversation starts with a user after system/context
      while (out.length && out[0].role !== 'user') out.shift();
      return out;
    };

    // Build thread: include history then latest user; normalization will dedupe consecutive users
    const normalizedThread = normalizeThread([...historyMsgsRaw, userMsg]);
    console.log('[Trips] chat normalized roles', normalizedThread.map(m => m.role));

    const messagesPayload = [system, userMsg];
    console.log('[Trips] chat sending roles', messagesPayload.map(m => m.role));
    let content;
    try {
      content = await askPerplexity({
        apiKey: process.env.PPLX_API_KEY,
        messages: messagesPayload,
        model: 'sonar',
        temperature: 0.2,
      });
    } catch (err) {
      // Fallback: collapse to a single user prompt with embedded context
      if (String(err.message || '').includes('invalid_message')) {
        const merged = {
          role: 'user',
          content: `Trip context: City=${trip.city}; Start=${trip.startDate}; End=${trip.endDate}; Preferences=${JSON.stringify(
            trip.preferences || {}
          )}.\nQuestion: ${message}.\nAnswer concisely with actionable tips and prices in THB. Do not create an itinerary.`,
        };
        content = await askPerplexity({
          apiKey: process.env.PPLX_API_KEY,
          messages: [merged],
          model: 'sonar',
          temperature: 0.2,
        });
      } else {
        throw err;
      }
    }

    const reply = typeof content === 'string' ? content.trim() : String(content ?? '');
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('[Trips] chat error', err);
    // Graceful local fallback to avoid terminal errors and keep chat responsive
    try {
      const city = trip?.city || 'your destination';
      const reply = `Here are some quick, trip-aware pointers for ${city}:
• Transport: Use ride-hailing or metro when available; avoid rush-hour (7–9am, 5–7pm).
• Food: Street food budget 60–150 THB; cafes 120–250 THB.
• Budgeting: Carry small cash for tuk-tuks/markets; most malls accept cards.
If you want a full day-by-day plan, use "New Itinerary with AI".`;
      return res.status(200).json({ reply });
    } catch {
      return next(err);
    }
  }
};