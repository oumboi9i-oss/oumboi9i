const express = require('express');
const router = express.Router();
const Account = require('../../models/accountModel');

// PUT: تحديث حساب عن طريق ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, phone, isActive } = req.body;

    // 1. التحقق من أن الـ ID صحيح
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid account ID' 
      });
    }

    // 2. التحقق من أن الإيميل غير مستخدم من حساب آخر
    if (email) {
      const existingAccount = await Account.findOne({ 
        email, 
        _id: { $ne: id } // ما يلقاش نفس الإيميل إلا كان هو نفس الحساب
      });
      
      if (existingAccount) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email already used by another account' 
        });
      }
    }

    // 3. تحضير البيانات للتحديث
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) updateData.password = password; // ✅ الموديل كدير hash بوحدو
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    // 4. التحديث
    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,        // يرجع البيانات المحدثة
        runValidators: true  // يتحقق من البيانات
      }
    ).select('-password'); // ما يرجعش password

    if (!updatedAccount) {
      return res.status(404).json({ 
        success: false, 
        error: 'Account not found' 
      });
    }

    console.log('✅ Account updated:', updatedAccount._id);

    res.json({ 
      success: true, 
      message: 'Account updated successfully',
      account: updatedAccount
    });

  } catch (error) {
    console.error('❌ Error updating account:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;