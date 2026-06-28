const express = require('express');
const router = express.Router();
const Account = require('../../models/accountModel');

// DELETE: حذف حساب عن طريق ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. التحقق من أن الـ ID صحيح
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid account ID' 
      });
    }

    // 2. البحث عن الحساب وحذفه
    const deletedAccount = await Account.findByIdAndDelete(id);

    if (!deletedAccount) {
      return res.status(404).json({ 
        success: false, 
        error: 'Account not found' 
      });
    }

    console.log('✅ Account deleted:', deletedAccount._id);

    res.json({ 
      success: true, 
      message: 'Account deleted successfully',
      deletedAccount: {
        id: deletedAccount._id,
        username: deletedAccount.username,
        email: deletedAccount.email
      }
    });

  } catch (error) {
    console.error('❌ Error deleting account:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;