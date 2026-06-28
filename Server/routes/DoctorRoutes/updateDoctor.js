const express = require('express');
const router = express.Router();
const Doctor = require('../../models/DoctorModel');

// ✅ مهم جداً: '/' فقط، ماشي '/:id'
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, specialty, numOrdre, location, isAvailable } = req.body;

        console.log('✏️ Updating doctor:', id);

        const updated = await Doctor.findByIdAndUpdate(
            id, 
            { fullName, email, specialty, numOrdre, location, isAvailable },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        
        res.json({ success: true, message: 'Doctor updated', doctor: updated });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;