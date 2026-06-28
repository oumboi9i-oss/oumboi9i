const express = require('express');
const router = express.Router();
const Manager = require('../../models/Manager');

router.post('/', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    const existing = await Manager.findOne({ email });
    if (existing) return res.status(400).json({ message: 'هذا المدير موجود بالفعل' });

    const newManager = new Manager({ email, password, fullName });
    await newManager.save();

    res.status(201).json({ message: 'تم إنشاء المدير بنجاح', manager: newManager });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء المدير', error: error.message });
  }
});

module.exports = router;
