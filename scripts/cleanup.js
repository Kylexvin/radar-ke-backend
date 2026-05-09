import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../src/models/Category.js';

dotenv.config();

const categories = [
  { 
    name: "Fundi", 
    slug: "fundi", 
    iconName: "build",           // ✅ wrench/build
    color: "#FF4444", 
    isActive: true, 
    displayOrder: 1 
  },
  { 
    name: "Food", 
    slug: "food", 
    iconName: "restaurant",      // ✅ restaurant
    color: "#FF8C00", 
    isActive: true, 
    displayOrder: 2 
  },
  { 
    name: "Bodaboda", 
    slug: "bodaboda", 
    iconName: "motorcycle",      // ✅ Change from "motorbike" to "motorcycle"
    color: "#FFD700", 
    isActive: true, 
    displayOrder: 3 
  },
  { 
    name: "Salon & Barber", 
    slug: "salon", 
    iconName: "content-cut",     // ✅ scissors
    color: "#FF69B4", 
    isActive: true, 
    displayOrder: 4 
  },
  { 
    name: "Tutor", 
    slug: "tutor", 
    iconName: "school",          // ✅ school
    color: "#FF5555", 
    isActive: true, 
    displayOrder: 5 
  },
  { 
    name: "Delivery", 
    slug: "delivery", 
    iconName: "local-shipping",  // ✅ delivery truck
    color: "#FF2020", 
    isActive: true, 
    displayOrder: 6 
  },
  { 
    name: "Healthcare", 
    slug: "health", 
    iconName: "local-hospital",  // ✅ hospital
    color: "#14B8A6", 
    isActive: true, 
    displayOrder: 7 
  }
];

const seedCategories = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rada-ke';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    await Category.insertMany(categories);
    console.log(`✅ Seeded ${categories.length} categories`);

    // Display seeded categories
    const seeded = await Category.find().sort({ displayOrder: 1 });
    console.log('\n📋 Categories seeded:');
    seeded.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug}) - icon: ${cat.iconName}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();