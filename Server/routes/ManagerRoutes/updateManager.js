const express = require('express');
const router = express.Router();
const Manager = require('../../models/Manager');

router.put('/:id', async (req, res) => {
  try {
    const updated = await Manager.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'المدير غير موجود' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث المدير', error: error.message });
  }
});

module.exports = router;
