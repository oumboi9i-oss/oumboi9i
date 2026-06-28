const express = require('express');
const router = express.Router();
const Email = require('../../models/email');

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Fetching email:', id);

        const email = await Email.findById(id);

        if (!email) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }

        res.json({ success: true, email });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;