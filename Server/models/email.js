const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    to: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    text: { type: String, default: '' },
    html: { type: String, default: '' },
    status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
    messageId: { type: String, default: '' },
    sentAt: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    collection: 'emails'
});

module.exports = mongoose.model('Email', emailSchema);