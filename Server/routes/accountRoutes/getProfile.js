// 📁 routes/accountRoutes/getProfile.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');

// GET /api/account/profile
router.get('/', protect, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;