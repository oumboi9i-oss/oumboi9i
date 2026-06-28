const express = require('express');
const router = express.Router();
const Message = require('../../models/Message');

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { senderId, receiverId, content, isRead } = req.body;

        console.log('✏️ Updating message:', id);

        const updated = await Message.findByIdAndUpdate(
            id, 
            { senderId, receiverId, content, isRead },
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        
        res.json({ success: true, message: 'Message updated', message: updated });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;