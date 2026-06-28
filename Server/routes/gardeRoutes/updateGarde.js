const express = require('express');
const router = express.Router();
const Garde = require('../../models/Garde');

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { owner, dateGarde, status } = req.body;

        console.log('✏️ Updating garde:', id);

        const updated = await Garde.findByIdAndUpdate(
            id, 
            { owner, dateGarde, status },
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Garde not found' });
        }
        
        res.json({ success: true, message: 'Garde updated', garde: updated });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;