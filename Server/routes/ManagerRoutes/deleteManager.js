const express = require('express');
const router = express.Router();
const Manager = require('../../models/Manager');

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Manager.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'المدير غير موجود' });
    res.json({ message: 'تم حذف المدير بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف المدير', error: error.message });
  }
});

module.exports = router;
