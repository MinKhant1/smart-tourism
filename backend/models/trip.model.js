import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, trim: true },
    city: String,
    startDate: String,
    endDate: String,
    preferences: Object
  },
  { timestamps: true }
);

export const Trip = mongoose.model('Trip', tripSchema);