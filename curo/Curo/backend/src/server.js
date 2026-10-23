import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env (parent folder) first, then fallback to local .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback if local .env exists

import app from './app.js';
import connectDB from './config/db.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Start Express server
const server = app.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
