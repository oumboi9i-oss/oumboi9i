const express = require('express');
const router = express.Router();
const Nurse = require('../../models/nurseModel');

router.get('/', async (req, res) => {
    try {
        const nurses = await Nurse.find().select('-password');
        res.json(nurses);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;