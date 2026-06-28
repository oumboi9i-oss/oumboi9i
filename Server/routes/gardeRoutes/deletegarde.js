const express = require('express');
const router = express.Router();
const Garde = require('../../models/Garde');

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting garde:', id);

        const deleted = await Garde.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Garde not found' });
        }
        
        res.json({ success: true, message: 'Garde deleted successfully' });

    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;