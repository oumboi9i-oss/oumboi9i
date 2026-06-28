// 📁 routes/emailRoutes/GetAllEmails.js
const express = require('express');
const router = express.Router();
const Email = require('../../models/email');
const { protect, authorize } = require('../../middleware/authMiddleware');

// 🔍 GET /api/emails - جلب كل الإيميلات (محمي للأدمن فقط)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const emails = await Email.find().sort({ sentAt: -1 });
    
    res.status(200).json({
      success: true,
      count: emails.length,
      emails: emails.map(email => ({
        id: email._id,
        to: email.to,
        subject: email.subject,
        status: email.status,
        sentAt: email.sentAt
      }))
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message
    });
  }
});

module.exports = router;