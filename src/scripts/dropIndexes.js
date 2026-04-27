import mongoose from 'mongoose';
import { config } from '../config/env.js';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import Category from '../models/Category.js';

const dropAllIndexes = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');
    
    // Drop all indexes from collections
    await User.collection.dropIndexes();
    console.log('✅ Dropped all indexes from users collection');
    
    await Provider.collection.dropIndexes();
    console.log('✅ Dropped all indexes from providers collection');
    
    await Category.collection.dropIndexes();
    console.log('✅ Dropped all indexes from categories collection');
    
    console.log('\n⚠️  Restart your server to recreate indexes cleanly');
    
    process.exit(0);
  } catch (error) {
    console.error('Error dropping indexes:', error.message);
    process.exit(1);
  }
};

dropAllIndexes();