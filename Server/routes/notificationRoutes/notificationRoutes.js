const express = require('express');
const router = express.Router();
const Notification = require('../../models/Notification');

// جلب كل الإشعارات ديال مستخدم
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// جلب الإشعارات غير المقروءة
router.get('/user/:userId/unread', async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.params.userId, 
      read: false 
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// تعليم الإشعار كمقروء
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// تعليم كل الإشعارات كمقروءة
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

module.exports = router;