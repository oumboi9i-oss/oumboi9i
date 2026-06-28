const express = require('express');
const router = express.Router();
const Manager = require('../../models/Manager');

router.get('/', async (req, res) => {
  try {
    const all = await Manager.find().select('-password');
    res.json(all);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المديرين', error: error.message });
  }
});

module.exports = router;
