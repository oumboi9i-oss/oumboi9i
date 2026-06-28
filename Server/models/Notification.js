// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:        { type: String, required: true },
  type: {
    type: String,
    enum: [
      'demande_received',
      'demande_accepted',
      'demande_rejected',
      'director_review',
      'final_approved',
      'final_rejected',
      'chat_message',
      'account_request',
    ],
    required: true,
  },
  message:       { type: String, required: true },
  demandeId:     { type: String, default: null },
  read:          { type: Boolean, default: false },
  otherUserId:   { type: String, default: null },
  otherUserName: { type: String, default: null },
  // Tracks the outcome of a 'director_review' notification once a manager
  // approves/rejects the underlying demande. Stays 'pending' for every other
  // notification type (it's only meaningful for director_review).
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);