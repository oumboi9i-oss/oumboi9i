const express = require('express');
const router = express.Router();
const Message = require('../../models/Message');

// ✅ المسار: POST /api/message/add
router.post('/', async (req, res) => {
    try {
        const { senderId, receiverId, content, timestamp, isRead } = req.body;

        console.log('📝 Received message data:', { senderId, receiverId });

        if (!senderId || !receiverId || !content) {
            return res.status(400).json({ 
                success: false, 
                message: '⚠️ Please fill in all required fields' 
            });
        }

        const message = new Message({
            senderId,
            receiverId,
            content,
            timestamp: timestamp || new Date(),
            isRead: isRead || false
        });

        await message.save();
        
        console.log('✅ Message sent successfully');
        
        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully',
            message: {
                id: message._id,
                senderId: message.senderId,
                receiverId: message.receiverId
            }
        });

    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router;