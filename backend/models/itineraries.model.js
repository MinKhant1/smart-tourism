import mongoose from 'mongoose';

// Coerce various LLM output shapes for activities into proper objects
function normalizeActivitiesForSchema(val) {
  const toObj = (maybe) => {
    if (maybe && typeof maybe === 'object') return maybe;
    if (typeof maybe === 'string') {
      let s = maybe.trim();
      try {
        // Strip code fences if present
        s = s.replace(/```json|```/gi, '').trim();
        // If the entire array is stringified
        if (s.startsWith('[')) {
          let r = s
            .replace(/'/g, '"')
            .replace(/(\btime\b|\btitle\b|\btype\b|\baddress\b|\bnotes\b|\bcost_estimate\b|\bduration_minutes\b)\s*:/g, '"$1":');
          const arr = JSON.parse(r);
          if (Array.isArray(arr) && arr[0] && typeof arr[0] === 'object') return arr[0];
        } else {
          // Parse single object-ish string
          if (!s.startsWith('{') && s.includes('{')) s = s.slice(s.indexOf('{'));
          let r = s
            .replace(/'/g, '"')
            .replace(/(\btime\b|\btitle\b|\btype\b|\baddress\b|\bnotes\b|\bcost_estimate\b|\bduration_minutes\b)\s*:/g, '"$1":');
          const obj = JSON.parse(r);
          if (obj && typeof obj === 'object') return obj;
        }
      } catch {}
      // Minimal fallback wrapper
      return { time: '', title: s.slice(0, 140), type: 'other', address: '', notes: s, cost_estimate: 0, duration_minutes: 0 };
    }
    // Default empty object to avoid cast errors
    return { time: '', title: '', type: 'other', address: '', notes: '', cost_estimate: 0, duration_minutes: 0 };
  };

  if (Array.isArray(val)) {
    return val.map((v) => toObj(v)).filter((x) => x && typeof x === 'object');
  }
  if (typeof val === 'string') {
    try {
      let r = val.replace(/```json|```/gi, '').trim();
      if (!r.startsWith('[')) r = `[${r}]`;
      r = r
        .replace(/'/g, '"')
        .replace(/(\btime\b|\btitle\b|\btype\b|\baddress\b|\bnotes\b|\bcost_estimate\b|\bduration_minutes\b)\s*:/g, '"$1":');
      const arr = JSON.parse(r);
      if (Array.isArray(arr)) return arr.map((v) => toObj(v));
    } catch {}
    return [toObj(val)];
  }
  return [];
}

const ActivitySchema = new mongoose.Schema(
  {
    time: String,
    title: String,
    type: String,            // sightseeing|food|transport|shopping|nightlife|other
    address: String,
    notes: String,
    cost_estimate: Number,   // THB
    duration_minutes: Number
  },
  { _id: false }
);

const DayPlanSchema = new mongoose.Schema(
  {
    date: String,
    summary: String,
    activities: { type: [ActivitySchema], set: normalizeActivitiesForSchema },
    daily_budget_estimate: Number
  },
  { _id: false }
);

const itinerarySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', index: true },
    city: String,
    country: String,
    startDate: String,
    endDate: String,
    partySize: Number,
    preferences: Object,
    currency: { type: String, default: 'THB' },
    days: [DayPlanSchema],
    totals: {
      estimated_total_cost: Number,
      attractions_count: Number,
      food_spots_count: Number,
      transport_count: Number
    },
    source: { type: String, default: 'perplexity:sonar' }
  },
  { timestamps: true }
);

export const Itinerary = mongoose.model('Itinerary', itinerarySchema);
