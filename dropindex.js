import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI; // Update this if needed

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const result = await mongoose.connection.db.collection('users').dropIndex('id_1');
    console.log('✅ Index dropped:', result);

    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  } catch (err) {
    console.error('❌ Error dropping index:', err.message);
  }
}

dropIndex();
