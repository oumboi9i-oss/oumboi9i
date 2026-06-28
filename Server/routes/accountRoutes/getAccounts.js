const express = require('express');
const router = express.Router();
const Account = require('../../models/accountModel');

// GET: جلب جميع الحسابات
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find().select('-password'); // ما تجيبش password
    
    res.json({ 
      success: true, 
      count: accounts.length,
      accounts 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;