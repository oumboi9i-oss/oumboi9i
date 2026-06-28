// nurseModel.js - updated with lat/lng
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const NurseSchema = new mongoose.Schema({
  userId:   { type: String, required: true },
  fullName: { type: String },
  password: { type: String, required: true, select: false },
  gmail:    { type: String, required: true, lowercase: true },
  diplome:  { type: String, enum: ['IDE', 'ISP'], required: true },
  service:  { type: String },
  equipe:   { type: String },
  location: { type: String },   // ✅ اسم المدينة
  wilaya:   { type: String },
  lat:      { type: Number },   // ✅ خط العرض
  lng:      { type: Number },   // ✅ خط الطول
}, { collection: "nurses", timestamps: true });

NurseSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

NurseSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.Nurse || mongoose.model('Nurse', NurseSchema);