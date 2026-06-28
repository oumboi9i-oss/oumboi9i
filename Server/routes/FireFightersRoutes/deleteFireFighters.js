const express = require('express');
const router = express.Router();
const FireFighter = require('../../models/FireFighters');

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting firefighter:', id);

        const deleted = await FireFighter.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'FireFighter not found' });
        }
        
        res.json({ success: true, message: 'FireFighter deleted successfully' });

    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;