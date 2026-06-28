const express = require('express');
const router = express.Router();
const Email = require('../../models/email');

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { to, subject, text, html, status } = req.body;

        console.log('✏️ Updating email:', id);

        const updated = await Email.findByIdAndUpdate(
            id, 
            { to, subject, text, html, status },
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }
        
        res.json({ success: true, message: 'Email updated', email: updated });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;