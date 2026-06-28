const mongoose = require('mongoose');

const FacilitySchema = new mongoose.Schema({
  name:    { type: String, required: true },
  type:    { type: String, enum: ['hospital', 'pharmacy', 'firestation'], required: true },
  wilaya:  { type: String, required: true },
  lat:     { type: Number, required: true },
  lng:     { type: Number, required: true },
  address: { type: String, default: '' },
  osmId:   { type: String, unique: true, required: true },
}, { collection: 'facilities', timestamps: true });

FacilitySchema.index({ wilaya: 1, type: 1 });

module.exports = mongoose.model('Facility', FacilitySchema);
