import { askPerplexity } from '../lib/perplexity.js';

// JSON Schema Perplexity will validate against (strict = true)
const itineraryJsonSchema = {
  name: 'itinerary_schema',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      city: { type: 'string' },
      country: { type: 'string' },
      startDate: { type: 'string' }, // YYYY-MM-DD
      endDate: { type: 'string' },   // YYYY-MM-DD
      partySize: { type: 'number' },
      currency: { type: 'string' },
      days: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            date: { type: 'string' },
            summary: { type: 'string' },
            activities: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  time: { type: 'string' },
                  title: { type: 'string' },
                  type: { type: 'string' },   // sightseeing|food|transport|shopping|nightlife|other
                  address: { type: 'string' },
                  notes: { type: 'string' },
                  cost_estimate: { type: 'number' },
                  duration_minutes: { type: 'number' }
                },
                required: ['time','title','type']
              }
            },
            daily_budget_estimate: { type: 'number' }
          },
          required: ['date','activities']
        }
      },
      totals: {
        type: 'object',
        additionalProperties: false,
        properties: {
          estimated_total_cost: { type: 'number' },
          attractions_count: { type: 'number' },
          food_spots_count: { type: 'number' },
          transport_count: { type: 'number' }
        }
      }
    },
    required: ['city','country','startDate','endDate','partySize','currency','days']
  },
  strict: true
};

function systemPrompt() {
  return `You are a travel planner. Return ONLY JSON that matches the given JSON Schema.
- Currency must be THB.
- City logistics: Bangkok example should favor BTS/MRT/walking.
- Cover EVERY day from startDate to endDate inclusive.
- Cluster nearby attractions, be realistic with time & costs.
- No explanations, no code fences, JSON only.`;
}

export const planTripFromText = async (req, res, next) => {
  try {
    const { query, defaultCity = 'Bangkok', defaultCountry = 'Thailand', defaultPartySize = 2, save = false } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Body must include "query": string' });
    }

    const userMsg = {
      role: 'user',
      content:
        `User request: ${query}
If dates, city, or party size are missing or ambiguous, infer sensibly.
- If city missing, use ${defaultCity}.
- If country missing, use ${defaultCountry}.
- If partySize missing, use ${defaultPartySize}.
- currency: THB.
Return ONLY JSON matching the schema.`
    };

    const content = await askPerplexity({
      apiKey: process.env.PPLX_API_KEY,
      messages: [{ role: 'system', content: systemPrompt() }, userMsg],
      model: 'sonar', // or 'sonar-pro' if you have access
      responseFormat: {
        type: 'json_schema',
        json_schema: itineraryJsonSchema
      }
    });

    // Perplexity returns valid JSON text per schema; still parse defensively
    const json = JSON.parse(content);

    // optional: persist under current user if save=true and you have auth in place
    if (save && req.userId) {
      const { Itinerary } = await import('../models/itineraries.model.js');
      const doc = await Itinerary.create({
        userId: req.userId,
        city: json.city,
        country: json.country,
        startDate: json.startDate,
        endDate: json.endDate,
        partySize: json.partySize,
        preferences: {}, // unknown from free text; store later if needed
        currency: json.currency || 'THB',
        days: json.days,
        totals: json.totals,
        source: 'perplexity:sonar'
      });
      return res.status(201).json({ itinerary: doc, source: 'saved' });
    }

    // return raw JSON itinerary without saving
    return res.status(200).json({ itinerary: json, source: 'perplexity' });
  } catch (err) {
    // If content had code fences or minor format issues
    try {
      const cleaned = (err?.message?.includes('Unexpected token') && err?.content)
        ? err.content.replace(/```json|```/g, '').trim()
        : null;
      if (cleaned) {
        const json = JSON.parse(cleaned);
        return res.status(200).json({ itinerary: json, source: 'perplexity-cleaned' });
      }
    } catch {}
    next(err);
  }
};
