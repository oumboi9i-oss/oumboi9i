const express = require('express');
const router = express.Router();
const FireFighter = require('../../models/FireFighters');

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, userId, gmail, matricule, grade, uniteIntervention } = req.body;

        console.log('✏️ Updating firefighter:', id);

        const updated = await FireFighter.findByIdAndUpdate(
            id,
            { fullName, userId, gmail, matricule, grade, uniteIntervention },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'FireFighter not found' });
        }
        
        res.json({ success: true, message: 'FireFighter updated', firefighter: updated });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;