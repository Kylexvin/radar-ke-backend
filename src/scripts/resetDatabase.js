import mongoose from 'mongoose';
import { config } from '../config/env.js';

const resetDatabase = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');
    
    // Drop entire collections (not just indexes)
    const collections = ['users', 'providers', 'categories', 'scans'];
    
    for (const collection of collections) {
      try {
        await mongoose.connection.db.dropCollection(collection);
        console.log(`✅ Dropped collection: ${collection}`);
      } catch (err) {
        console.log(`⚠️ Collection ${collection} may not exist yet`);
      }
    }
    
    console.log('\n✅ Database reset complete!');
    console.log('Restart your server to recreate collections with clean indexes\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();