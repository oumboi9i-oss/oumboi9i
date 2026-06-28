const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Facility = require('../../models/Facility');

router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'your_secret_key');

    const { wilaya, type } = req.query;
    if (!wilaya || !type) {
      return res.status(400).json({ success: false, message: 'wilaya and type query params are required' });
    }

    const facilities = await Facility.find({ wilaya, type }).select('-__v').lean();
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
