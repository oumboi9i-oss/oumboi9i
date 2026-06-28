const express = require('express');
const router = express.Router();
const Nurse = require('../../models/nurseModel');

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, userId, gmail, diplome, service, equipe } = req.body;

        console.log('✏️ Updating nurse:', id);

        const updated = await Nurse.findByIdAndUpdate(
            id,
            { fullName, userId, gmail, diplome, service, equipe },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Nurse not found' });
        }
        
        res.json({ success: true, message: 'Nurse updated', nurse: updated });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;