import { z } from 'zod';
import { Itinerary } from '../models/itineraries.model.js';
import { askPerplexity } from '../lib/perplexity.js';

const planSchema = z.object({
  city: z.string().min(2),
  country: z.string().default('Thailand'),
  startDate: z.string(),
  endDate: z.string(),
  partySize: z.number().int().positive().default(1),
  preferences: z.object({
    pace: z.enum(['easy', 'balanced', 'packed']).default('balanced'),
    interests: z.array(z.string()).default([]),
    dietary: z.array(z.string()).default([]),
    budgetTier: z.enum(['low', 'mid', 'high']).default('mid')
  }).partial().default({})
});

function itinerarySystemPrompt() {
  return `You are a travel planner that returns STRICT JSON ONLY, no prose.
Currency: THB. City logistics: Bangkok.
Schema:
{
  "city": "string",
  "country": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "partySize": number,
  "currency": "THB",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "summary": "string",
      "activities": [
        {
          "time": "HH:mm",
          "title": "string",
          "type": "sightseeing|food|transport|shopping|nightlife|other",
          "address": "string",
          "notes": "string",
          "cost_estimate": number,
          "duration_minutes": number
        }
      ],
      "daily_budget_estimate": number
    }
  ],
  "totals": {
    "estimated_total_cost": number,
    "attractions_count": number,
    "food_spots_count": number,
    "transport_count": number
  }
}
Rules:
- Include every date from startDate to endDate inclusive.
- Prefer BTS/MRT/walk; cluster nearby sights.
- Respect pace & interests; include weather-safe backups.
- All prices in THB. Return ONLY valid JSON.`;
}

export const planTrip = async (req, res, next) => {
  try {
    const parsed = planSchema.parse(req.body);
    const { city, country, startDate, endDate, partySize, preferences } = parsed;

    const userMsg = {
      role: 'user',
      content: `Plan a trip to ${city}, ${country} from ${startDate} to ${endDate} for ${partySize} people.
Preferences: ${JSON.stringify(preferences)}.
Return ONLY JSON following the schema.`
    };

    const content = await askPerplexity({
      apiKey: process.env.PPLX_API_KEY,
      messages: [{ role: 'system', content: itinerarySystemPrompt() }, userMsg],
      model: 'sonar'
    });

    let json;
    try {
      json = JSON.parse(content);
    } catch {
      json = JSON.parse(content.replace(/```json|```/g, '').trim());
    }

    const doc = await Itinerary.create({
      userId: req.userId,
      city: json.city ?? city,
      country: json.country ?? country,
      startDate,
      endDate,
      partySize,
      preferences,
      currency: 'THB',
      days: json.days ?? [],
      totals: json.totals ?? {}
    });

    res.status(201).json({ itinerary: doc });
  } catch (err) {
    next(err);
  }
};

export const myItineraries = async (req, res, next) => {
  try {
    const list = await Itinerary.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ items: list });
  } catch (err) {
    next(err);
  }
};
