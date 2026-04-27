import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { errorHandler, notFound } from './src/middleware/error.middleware.js';
import { HTTP_STATUS, RATE_LIMIT } from './src/utils/constants.js';

// Import routes
import authRoutes from './src/routes/auth.routes.js';

// Initialize express app
const app = express();

// Connect to database
await connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: config.isDevelopment ? '*' : process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression for response bodies
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging with Morgan
if (config.isDevelopment) {
  app.use(morgan('dev')); // Colored, concise output for development
} else {
  app.use(morgan('combined')); // Apache combined format for production
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    name: 'RADA KE API',
    version: '1.0.0',
    status: 'running',
    environment: config.nodeEnv,
    endpoints: {
      health: '/health',
      auth: '/api/auth',
    }
  });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
  server.close(() => {
    process.exit(1);
  });
});

export default app;