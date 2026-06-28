const express = require('express');
const router = express.Router();
const Manager = require('../../models/Manager');

router.get('/:id', async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id).select('-password');
    if (!manager) return res.status(404).json({ message: 'المدير غير موجود' });
    res.json(manager);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المدير', error: error.message });
  }
});

module.exports = router;
