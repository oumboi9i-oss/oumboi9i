const express = require('express');
const router = express.Router();
const Nurse = require('../../models/nurseModel');

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting nurse:', id);

        const deleted = await Nurse.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Nurse not found' });
        }
        
        res.json({ success: true, message: 'Nurse deleted successfully' });

    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;