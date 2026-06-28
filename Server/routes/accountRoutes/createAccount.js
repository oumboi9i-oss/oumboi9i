const express = require('express');
const router = express.Router();
const Account = require('../../models/accountModel');
const bcrypt = require('bcryptjs'); // ← أضفنا bcrypt

router.post('/', async (req, res) => {
  try {
    const { username, email, password, phone, role } = req.body;

    // 🔐 تشفير كلمة السر يدوياً
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // إنشاء المستخدم بكلمة السر المشفرة
    const newUser = new Account({
      username,
      email: email.toLowerCase(),
      password: hashedPassword, // ← الكلمة المشفرة
      phone,
      role: role || 'user'
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "تم إنشاء الحساب بنجاح ✅",
      user: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في إنشاء الحساب",
      error: error.message
    });
  }
});

module.exports = router;