// routes/messageRoutes/GetConversation.js
const express = require('express');
const router = express.Router();
const Message = require('../../models/Message');

// GET /api/message/conversation/:userId1/:userId2
router.get('/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ timestamp: 1 });

    await Message.updateMany(
      { senderId: userId2, receiverId: userId1, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/message/conversation/contacts/:userId
// يجيب كل الناس اللي هكيت معهم
router.get('/contacts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ timestamp: -1 });

    // نجمع الـ contacts الفريدين
    const contactMap = {};
    messages.forEach((m) => {
      const otherId = m.senderId === userId ? m.receiverId : m.senderId;
      if (!contactMap[otherId]) {
        contactMap[otherId] = { contactId: otherId, lastMsg: m };
      }
    });

    res.json({ success: true, contacts: Object.values(contactMap) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;