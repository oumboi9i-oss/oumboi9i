const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/User');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/User');
    
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

connectDB();

module.exports = mongoose;