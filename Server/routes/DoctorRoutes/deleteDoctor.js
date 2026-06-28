// 📁 routes/doctor/delete.js
const express = require('express');
const router = express.Router();
const Doctor = require('../../models/DoctorModel');

// ✅ DELETE /api/doctor/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting doctor with ID:', id);

        const deleted = await Doctor.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        console.log('✅ Doctor deleted successfully:', deleted.email);

        res.json({
            success: true,
            message: 'Doctor deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;