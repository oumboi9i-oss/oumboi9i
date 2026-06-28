const express = require('express');
const router = express.Router();
const Pharmacist = require('../../models/pharmacistModel');

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, userId, gmail, nomPharmacie, adressePharmacie, numAgrement, isNightShift } = req.body;

        console.log('✏️ Updating pharmacist:', id);

        const updated = await Pharmacist.findByIdAndUpdate(
            id,
            { fullName, userId, gmail, nomPharmacie, adressePharmacie, numAgrement, isNightShift },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Pharmacist not found' });
        }
        
        res.json({ success: true, message: 'Pharmacist updated', pharmacist: updated });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;