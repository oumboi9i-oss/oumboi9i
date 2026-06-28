const express = require('express');
const router = express.Router();
const Garde = require('../../models/Garde');

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Fetching garde:', id);

        const garde = await Garde.findById(id);

        if (!garde) {
            return res.status(404).json({ success: false, message: 'Garde not found' });
        }

        res.json({ success: true, garde });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;