import mongoose from 'mongoose';
import { config } from './env.js';

// Connection options
const options = {
  autoIndex: config.isDevelopment, // Auto-index only in development
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds
  family: 4 // Use IPv4, skip trying IPv6
};

// Connect to MongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri, options);
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected gracefully');
  } catch (error) {
    console.error('❌ Error disconnecting MongoDB:', error);
    process.exit(1);
  }
};

// Handle application termination
process.on('SIGINT', async () => {
  console.log('⚠️ SIGINT received. Closing MongoDB connection...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM received. Closing MongoDB connection...');
  await disconnectDB();
  process.exit(0);
});