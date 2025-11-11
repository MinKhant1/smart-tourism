import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, trim: true },
    city: String,
    startDate: String,
    endDate: String,
    preferences: Object,
    currency: { type: String, default: 'USD' }
  },
  { timestamps: true }
);

export const Trip = mongoose.model('Trip', tripSchema);