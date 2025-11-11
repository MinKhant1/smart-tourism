import mongoose from 'mongoose';

const DayPlanSchema = new mongoose.Schema(
  {
    date: String,
    summary: String,
    activities: [
      {
        time: String,
        title: String,
        type: String,            // sightseeing|food|transport|shopping|nightlife|other
        address: String,
        notes: String,
        cost_estimate: Number,   // THB
        duration_minutes: Number
      }
    ],
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
