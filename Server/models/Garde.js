// models/Garde.js - ✅ Updated: added ownerId, archived, archivedAt, transferredTo
const mongoose = require('mongoose');

const GardeSchema = new mongoose.Schema({
  id:        { type: String },
  owner:     { type: String },                                          // display name
  ownerId:   { type: mongoose.Schema.Types.ObjectId, default: null },  // ✅ NEW - user _id
  role:      { type: String, enum: ['doctor','nurse','firefighter','pharmacist'], default: 'doctor' }, // ✅ NEW
  dateGarde: { type: Date, required: true },
  time:      { type: String, default: '' },
  place:     { type: String, default: '' },
  service:   { type: String, default: '' },
  status:    { type: String, default: 'Active' },

  // ✅ NEW - Archive fields (set when director approves a garde exchange)
  archived:      { type: Boolean, default: false },
  archivedAt:    { type: Date,    default: null },
  transferredTo: { type: mongoose.Schema.Types.ObjectId, default: null },

}, {
  collection: "Garde",
  timestamps: true,
});

module.exports = mongoose.model('Garde', GardeSchema);