const express = require('express');
const router = express.Router();
const Pharmacist = require('../../models/pharmacistModel');

router.get('/', async (req, res) => {
    try {
        const pharmacists = await Pharmacist.find().select('-password');
        res.json(pharmacists);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;