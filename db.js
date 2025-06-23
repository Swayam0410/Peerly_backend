import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
console.log()
const dbConnect=()=>{
  mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});
}
export default dbConnect;
