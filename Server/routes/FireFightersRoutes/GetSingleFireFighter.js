const express = require('express');
const router = express.Router();
const FireFighter = require('../../models/FireFighters');

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Fetching firefighter:', id);

        const firefighter = await FireFighter.findById(id).select('-password');

        if (!firefighter) {
            return res.status(404).json({ success: false, message: 'FireFighter not found' });
        }

        res.json({ success: true, firefighter });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;