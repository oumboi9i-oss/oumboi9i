const express = require('express');
const router = express.Router();
const Pharmacist = require('../../models/pharmacistModel');

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Fetching pharmacist:', id);

        const pharmacist = await Pharmacist.findById(id).select('-password');

        if (!pharmacist) {
            return res.status(404).json({ success: false, message: 'Pharmacist not found' });
        }

        res.json({ success: true, pharmacist });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;