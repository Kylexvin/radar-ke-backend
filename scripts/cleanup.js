import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Provider from '../src/models/Provider.js';

// Load environment variables
dotenv.config();

// Boda boda providers around Kiambu Road / Kikuyu area
const bodaBodas = [
  {
    username: "boda_james",
    email: "james@boda.com",
    password: "boda123",
    providerData: {
      name: "James Boda - Kiambu Stage",
      phone: "0711000001",
      category: "bodaboda",
      locationLng: 36.7132,
      locationLat: -1.2825,
      locationAddress: "Kiambu Road Stage, Nairobi",
      radiusKm: 5,
      description: "Reliable boda boda, available 24/7. Knows all routes in Kiambu area."
    }
  },
  {
    username: "boda_peter",
    email: "peter@boda.com", 
    password: "boda123",
    providerData: {
      name: "Peter Riders",
      phone: "0711000002",
      category: "bodaboda",
      locationLng: 36.7180,
      locationLat: -1.2780,
      locationAddress: "Gitaru Shopping Centre",
      radiusKm: 6,
      description: "Fast and safe. Delivery and passenger services."
    }
  },
  {
    username: "boda_john",
    email: "john@boda.com",
    password: "boda123", 
    providerData: {
      name: "John's Boda Express",
      phone: "0711000003",
      category: "bodaboda",
      locationLng: 36.7080,
      locationLat: -1.2850,
      locationAddress: "Kikuyu Town",
      radiusKm: 7,
      description: "Experienced rider, best for school runs and shopping delivery."
    }
  },
  {
    username: "boda_david",
    email: "david@boda.com",
    password: "boda123",
    providerData: {
      name: "David Quick Ride",
      phone: "0711000004", 
      category: "bodaboda",
      locationLng: 36.7200,
      locationLat: -1.2750,
      locationAddress: "Wangige Junction",
      radiusKm: 5,
      description: "Available from 6am - 10pm. Cargo box available."
    }
  },
  {
    username: "boda_moses",
    email: "moses@boda.com",
    password: "boda123",
    providerData: {
      name: "Moses Boda Service",
      phone: "0711000005",
      category: "bodaboda", 
      locationLng: 36.7150,
      locationLat: -1.2800,
      locationAddress: "Kinoo Market",
      radiusKm: 4,
      description: "Delivery done within 30 minutes. Competitive rates."
    }
  },
  {
    username: "boda_paul",
    email: "paul@boda.com",
    password: "boda123",
    providerData: {
      name: "Paul's Boda Connect",
      phone: "0711000006",
      category: "bodaboda",
      locationLng: 36.7250,
      locationLat: -1.2700, 
      locationAddress: "Karuri Town",
      radiusKm: 8,
      description: "Long distance trips welcome. Negotiable rates."
    }
  }
];

const seedBodas = async () => {
  try {
    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/rada-ke';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    let created = 0;
    let skipped = 0;

    for (const boda of bodaBodas) {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ username: boda.username }, { email: boda.email }] 
      });
      
      if (existingUser) {
        console.log(`⚠️ Skipping ${boda.username} - already exists`);
        skipped++;
        continue;
      }

      // Create user
      const hashedPassword = await bcrypt.hash(boda.password, 10);
      const user = new User({
        username: boda.username,
        name: boda.providerData.name,
        email: boda.email,
        password: hashedPassword,
        authProvider: 'local',
        searchRadiusKm: 5,
        lastLocation: {
          type: 'Point',
          coordinates: [boda.providerData.locationLng, boda.providerData.locationLat]
        }
      });
      await user.save();
      console.log(`✅ Created user: ${boda.username}`);

      // Create provider profile
      const provider = new Provider({
        userId: user._id,
        name: boda.providerData.name,
        phone: boda.providerData.phone,
        whatsapp: boda.providerData.phone,
        category: boda.providerData.category,
        description: boda.providerData.description,
        location: {
          type: 'Point',
          coordinates: [boda.providerData.locationLng, boda.providerData.locationLat]
        },
        locationAddress: boda.providerData.locationAddress,
        radiusKm: boda.providerData.radiusKm,
        isActive: true,
        isVerified: true,
        rating: 4.5,
        totalRatings: 10
      });
      await provider.save();
      console.log(`✅ Created provider: ${boda.providerData.name}\n`);
      created++;
    }

    console.log('🎉 Seeding complete!');
    console.log(`Created: ${created} providers`);
    console.log(`Skipped: ${skipped} (already existed)`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedBodas();