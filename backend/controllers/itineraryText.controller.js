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
- Destination is provided via defaults; tailor transport/logistics to that city.
- Cover EVERY day from startDate to endDate inclusive.
- Cluster nearby attractions, be realistic with time & costs.
- No explanations, no code fences, JSON only.`;
}

export const planTripFromText = async (req, res, next) => {
  try {
    const {
      query,
      defaultCity = 'Bangkok',
      defaultCountry = 'Thailand',
      defaultPartySize = 2,
      save = false,
      startDate,
      endDate,
    } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Body must include "query": string' });
    }

    console.log('[ItineraryText] Incoming plan-text', {
      userId: req.userId,
      tripId: req.params?.id || req.body?.tripId,
      defaultCity,
      defaultCountry,
      defaultPartySize,
      save
    });

    const userMsg = {
      role: 'user',
      content:
        `User request: ${query}
Trip dates: ${startDate || 'UNKNOWN'} to ${endDate || 'UNKNOWN'} (cover EVERY date inclusive; do NOT shorten).
Defaults:
- city: ${defaultCity}
- country: ${defaultCountry || 'UNKNOWN'}
- partySize: ${defaultPartySize}
- currency: THB
Rules:
- Use provided startDate/endDate if present; ignore conflicting dates in the text.
- Use provided defaultCity/country as the destination; ignore conflicting locations.
- Return ONLY JSON matching the schema.`
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
    const json = typeof content === 'string' ? JSON.parse(content) : content;
    console.log('[ItineraryText] Parsed JSON from LLM', { daysCount: json?.days?.length, city: json?.city, source: 'perplexity' });

    // Normalize activities: Some LLM outputs may embed activities as a stringified block.
    const normalizeActivities = (acts) => {
      const toObj = (maybe) => {
        if (maybe && typeof maybe === 'object') return maybe;
        if (typeof maybe === 'string') {
          const s = maybe.trim();
          try {
            let r = s.replace(/```json|```/gi, '').trim();
            // If this looks like an entire array string, parse and take first element
            if (r.startsWith('[')) {
              r = r.replace(/'/g, '"');
              r = r.replace(/(\btime\b|\btitle\b|\btype\b|\baddress\b|\bnotes\b|\bcost_estimate\b|\bduration_minutes\b)\s*:/g, '"$1":');
              const arr = JSON.parse(r);
              if (Array.isArray(arr) && arr[0] && typeof arr[0] === 'object') return arr[0];
            } else {
              // Parse single object-like text
              if (!r.startsWith('{') && r.includes('{')) {
                // Trim any leading text before first brace
                r = r.slice(r.indexOf('{'));
              }
              r = r.replace(/'/g, '"');
              r = r.replace(/(\btime\b|\btitle\b|\btype\b|\baddress\b|\bnotes\b|\bcost_estimate\b|\bduration_minutes\b)\s*:/g, '"$1":');
              const obj = JSON.parse(r);
              if (obj && typeof obj === 'object') return obj;
            }
          } catch {}
        }
        // Fallback minimal object
        const text = typeof maybe === 'string' ? maybe : '';
        return { time: '', title: text.slice(0, 140), type: 'other', address: '', notes: text, cost_estimate: 0, duration_minutes: 0 };
      };

      if (Array.isArray(acts)) {
        return acts.map((a) => toObj(a)).filter((x) => x && typeof x === 'object');
      }

      if (typeof acts === 'string') {
        const s = acts.trim();
        try {
          let r = s.replace(/```json|```/gi, '').trim();
          if (!r.startsWith('[')) r = `[${r}]`;
          r = r.replace(/'/g, '"');
          r = r.replace(/(\btime\b|\btitle\b|\btype\b|\baddress\b|\bnotes\b|\bcost_estimate\b|\bduration_minutes\b)\s*:/g, '"$1":');
          const arr = JSON.parse(r);
          if (Array.isArray(arr)) return arr.map((a) => toObj(a));
        } catch {}
        return [toObj(s)];
      }

      return [];
    };

    // Build expected date range (inclusive) if we have explicit trip dates
    const useStart = startDate || json.startDate;
    const useEnd = endDate || json.endDate;

    const dateRange = (() => {
      try {
        if (!useStart || !useEnd) return [];
        const out = [];
        const s = new Date(useStart);
        const e = new Date(useEnd);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          out.push(d.toISOString().slice(0, 10));
        }
        return out;
      } catch {
        return [];
      }
    })();

    const normalizedDaysRaw = Array.isArray(json.days)
      ? json.days.map((d, idx) => {
          const activities = normalizeActivities(d?.activities);
          return {
            date: d?.date || useStart || `Day ${idx + 1}`,
            summary: d?.summary || '',
            activities,
            daily_budget_estimate: typeof d?.daily_budget_estimate === 'number' ? d.daily_budget_estimate : 0
          };
        })
      : [];

    // Align to date range: ensure each expected date has an entry
    const normalizedDays = dateRange.length
      ? dateRange.map((date, idx) => {
          const found = normalizedDaysRaw.find((d) => d.date === date) || normalizedDaysRaw[idx];
          if (found) return found;
          return { date, summary: '', activities: [], daily_budget_estimate: 0 };
        })
      : normalizedDaysRaw;

    console.log('[ItineraryText] Normalized first day sample', {
      hasDays: normalizedDays.length > 0,
      firstActivitiesType: Array.isArray(normalizedDays[0]?.activities) ? typeof normalizedDays[0]?.activities[0] : null
    });

    // optional: persist under current user if save=true and you have auth in place
    if (save && req.userId) {
      const { Itinerary } = await import('../models/itineraries.model.js');
      const doc = await Itinerary.create({
        userId: req.userId,
        tripId: req.params?.id || req.body?.tripId,
        // Force destination to the trip/defaults to avoid LLM drifting
        city: (req.body?.defaultCity ?? json.city ?? ''),
        country: (req.body?.defaultCountry ?? json.country ?? ''),
        startDate: useStart || json.startDate,
        endDate: useEnd || json.endDate,
        partySize: json.partySize,
        preferences: {}, // unknown from free text; store later if needed
        currency: json.currency || 'THB',
        days: normalizedDays,
        totals: json.totals,
        source: 'perplexity:sonar'
      });
      console.log('[ItineraryText] Saved itinerary', { id: doc._id, tripId: doc.tripId, city: doc.city, country: doc.country });
      return res.status(201).json({ itinerary: doc, source: 'saved' });
    }

    // return raw JSON itinerary without saving
    return res.status(200).json({ itinerary: json, source: 'perplexity' });
  } catch (err) {
    console.error('[ItineraryText] plan-text error', err);
    // If Perplexity failed or API key is missing, attempt a graceful fallback.
    try {
      const cleaned = (err?.message?.includes('Unexpected token') && err?.content)
        ? err.content.replace(/```json|```/g, '').trim()
        : null;
      if (cleaned) {
        const json = JSON.parse(cleaned);
        return res.status(200).json({ itinerary: json, source: 'perplexity-cleaned' });
      }
    } catch {}

    // Persist a minimal itinerary when save=true, so users can still create
    // itineraries for a trip even if the AI call fails.
    try {
      if (req.body?.save && req.userId) {
        const today = new Date();
        const start = (req.body?.startDate) || today.toISOString().slice(0, 10);
        const endDateObj = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
        const end = (req.body?.endDate) || endDateObj.toISOString().slice(0, 10);
        const city = req.body?.defaultCity || 'Bangkok';
        const country = req.body?.defaultCountry || 'Thailand';
        const partySize = Number(req.body?.defaultPartySize || 2);

        const { Itinerary } = await import('../models/itineraries.model.js');

        // Build full inclusive date range
        const placeholderDays = (() => {
          try {
            const out = [];
            const s = new Date(start);
            const e = new Date(end);
            let i = 1;
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().slice(0, 10);
              out.push({
                date: dateStr,
                summary: `Day ${i} placeholder itinerary`,
                activities: [
                  { time: '09:00', title: 'Explore city center', type: 'sightseeing', notes: '', cost_estimate: 0, duration_minutes: 120 }
                ],
                daily_budget_estimate: 0
              });
              i += 1;
            }
            return out;
          } catch {
            return [
              {
                date: start,
                summary: 'Day 1 placeholder itinerary',
                activities: [
                  { time: '09:00', title: 'Explore city center', type: 'sightseeing', notes: '', cost_estimate: 0, duration_minutes: 120 }
                ],
                daily_budget_estimate: 0
              }
            ];
          }
        })();

        const doc = await Itinerary.create({
          userId: req.userId,
          tripId: req.params?.id || req.body?.tripId,
          city,
          country,
          startDate: start,
          endDate: end,
          partySize,
          preferences: {},
          currency: 'THB',
          days: placeholderDays,
          totals: { estimated_total_cost: 0, attractions_count: 1, food_spots_count: 0, transport_count: 0 },
          source: 'fallback'
        });
        console.log('[ItineraryText] Fallback saved itinerary', { id: doc._id, tripId: doc.tripId });
        return res.status(201).json({ itinerary: doc, source: 'fallback-saved' });
      }
    } catch (fallbackErr) {
      // Continue to error middleware if fallback also fails
      return next(fallbackErr);
    }

    // If no fallback path applied, forward the original error
    next(err);
  }
};
