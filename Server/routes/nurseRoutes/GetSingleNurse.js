const express = require('express');
const router = express.Router();
const Nurse = require('../../models/nurseModel');

// ✅ GET /api/nurse/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Fetching nurse:', id);

        const nurse = await Nurse.findById(id).select('-password');

        if (!nurse) {
            return res.status(404).json({ success: false, message: 'Nurse not found' });
        }

        res.json({ success: true, nurse });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;