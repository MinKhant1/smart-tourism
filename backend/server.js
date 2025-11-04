import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './lib/db.js';

import authRoutes from './routes/auth.route.js';


import { notFound, errorHandler } from './middleware/error.middleware.js';
import itineraryTextRoutes from './routes/itineraryText.route.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
// app.use('/api/itineraries', itinerariesRoutes);
app.use('/api/itineraries', itineraryTextRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 4000;

connectDB(process.env.MONGO_URI)
  .then(() => app.listen(port, () => console.log(`🚀 API listening on :${port}`)))
  .catch((err) => {
    console.error('Mongo connect failed', err);
    process.exit(1);
  });
