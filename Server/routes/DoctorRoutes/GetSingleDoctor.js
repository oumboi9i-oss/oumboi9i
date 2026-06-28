const express = require('express');
const router = express.Router();
const Doctor = require('../../models/DoctorModel');

router.get('/:id', async (req, res) => {  // ← زيد /:id هنا
    try {
        const { id } = req.params;
        console.log('🔍 Fetching doctor:', id);

        const doctor = await Doctor.findById(id).select('-password');

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        res.json({ success: true, doctor });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;