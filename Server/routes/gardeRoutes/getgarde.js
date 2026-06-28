const express = require('express');
const router = express.Router();
const Garde = require('../../models/Garde');

// ✅ المسار: GET /api/garde/getAll
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        const gardes = await Garde.find(filter);
        res.json(gardes);
    } catch (error) {
        console.error('❌ Error fetching gardes:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;