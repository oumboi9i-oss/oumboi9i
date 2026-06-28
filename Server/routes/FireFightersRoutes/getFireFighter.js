const express = require('express');
const router = express.Router();
const FireFighter = require('../../models/FireFighters');

// ✅ المسار: GET /api/firefighter/getAll
router.get('/', async (req, res) => {
    try {
        const firefighters = await FireFighter.find().select('-password');
        res.json(firefighters);
    } catch (error) {
        console.error('❌ Error fetching firefighters:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router;