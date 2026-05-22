import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Invoice from '../models/invoiceModel.js';

// Load environment variables from .env file
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
    
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

export default connectDB;
