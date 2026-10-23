import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import routes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for development and live polling
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request loggers & parsers
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Support both /api and /api/v1 prefix seamlessly
app.use('/api/v1', routes);
app.use('/api', routes);

// 404 handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

export default app;
