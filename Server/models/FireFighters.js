// FireFighters.js - updated with lat/lng
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const FireFighterSchema = new mongoose.Schema({
  userId:            { type: String },
  fullName:          { type: String },
  gmail:             { type: String, required: true, lowercase: true },
  matricule:         { type: String, required: true },
  password:          { type: String, required: false, select: false },
  grade:             { type: String },
  uniteIntervention: { type: String },
  location:          { type: String },   // ✅ اسم المدينة
  wilaya:            { type: String },
  lat:               { type: Number },   // ✅ خط العرض
  lng:               { type: Number },   // ✅ خط الطول
}, { collection: "FireFighter", timestamps: true });

FireFighterSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

FireFighterSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.FireFighter || mongoose.model('FireFighter', FireFighterSchema);