// 📁 ضع هذا الملف فـ Server/ وشغله مرة وحدة فقط
// الأمر: node createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/User';

const accountSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);

async function createAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected');

        // تحقق إذا admin موجود
        const existing = await Account.findOne({ email: 'admin@switchguard.com' });
        if (existing) {
            console.log('⚠️ Admin already exists!');
            process.exit(0);
        }

        // تشفير الباسوورد
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // إنشاء الـ admin
        const admin = new Account({
            email: 'admin@switchguard.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true
        });

        await admin.save();
        console.log('✅ Admin created successfully!');
        console.log('📧 Email: admin@switchguard.com');
        console.log('🔐 Password: admin123');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

createAdmin();