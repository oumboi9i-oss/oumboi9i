// DoctorModel.js - updated with lat/lng for map
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const DoctorSchema = new mongoose.Schema({
  userId:      { type: String },
  email:       { type: String, required: true, lowercase: true },
  password:    { type: String, required: true, select: false },
  fullName:    { type: String, required: true },
  specialty:   { type: String },
  numOrdre:    { type: String },
  location:    { type: String },   // ← اسم المدينة
  wilaya:      { type: String },
  lat:         { type: Number },   // ✅ خط العرض
  lng:         { type: Number },   // ✅ خط الطول
  isAvailable: { type: Boolean, default: true }
}, { collection: "doctors", timestamps: true });

DoctorSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

DoctorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);