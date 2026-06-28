const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Account = require('../models/accountModel');

mongoose.connect('mongodb://localhost:27017/User', async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    
    console.log('🔑 New Hash:', hash);
    
    const result = await Account.updateOne(
      { email: 'admin@switchguard.com' },
      { $set: { password: hash } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Password updated successfully!');
      console.log('🔑 You can now login with: admin123');
    } else {
      console.log('⚠️ No account found with this email.');
    }
    
    mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
});