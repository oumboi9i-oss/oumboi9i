const mongoose = require('mongoose');
const Account = require('../models/accountModel'); // تأكد من المسار

const createAdmin = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/User');
    console.log('🔌 Connected to MongoDB');

    // حذف أي Admin قديم
    await Account.deleteOne({ email: 'admin@switchguard.com' });
    console.log('🗑️ Old admin deleted (if existed)');

    // ✅ كريات Admin جديد - الباسوورد عادي والموديل غيشفره أوتوماتيكياً
    const admin = new Account({
      email: 'admin@switchguard.com',
      password: 'admin123',  // ← عادي! الموديل غيشفره
      role: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('🔑 Login with:');
    console.log('   Email: admin@switchguard.com');
    console.log('   Password: admin123');

    mongoose.connection.close();
    console.log('🔌 Disconnected');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    mongoose.connection.close();
  }
};

createAdmin();