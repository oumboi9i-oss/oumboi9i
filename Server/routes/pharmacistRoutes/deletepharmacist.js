const express = require('express');
const router = express.Router();
const Pharmacist = require('../../models/pharmacistModel');

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting pharmacist:', id);

        const deleted = await Pharmacist.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Pharmacist not found' });
        }
        
        res.json({ success: true, message: 'Pharmacist deleted successfully' });

    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;