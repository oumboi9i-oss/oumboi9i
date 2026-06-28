const express = require('express');
const router = express.Router();
const Garde = require('../../models/Garde');

router.post('/', async (req, res) => {
  try {
    const { owner, dateGarde, status, ownerId, role, time, place, service } = req.body;

    if (!ownerId) {
      return res.status(400).json({
        message: '❌ ownerId is required',
        received: req.body
      });
    }

    const newGarde = new Garde({
      owner: owner || 'Unknown',
      ownerId,
      dateGarde,
      time:    time    || '',
      place:   place   || '',
      service: service || '',
      status: status || 'Active',
      role: role || 'doctor',
    });

    await newGarde.save();
    res.status(201).json({ message: '✅ Garde created', garde: newGarde });

  } catch (error) {
    console.error('❌ Error creating garde:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;