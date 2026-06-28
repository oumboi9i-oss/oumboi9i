// pharmacistModel.js - updated with lat/lng
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const PharmacistSchema = new mongoose.Schema({
  userId:           { type: String },
  fullName:         { type: String },
  gmail:            { type: String, required: true, lowercase: true },
  password:         { type: String, required: true, select: false },
  nomPharmacie:     { type: String, required: true },
  adressePharmacie: { type: String },
  numAgrement:      { type: String, required: true },
  location:         { type: String },   // ✅ اسم المدينة
  wilaya:           { type: String },
  lat:              { type: Number },   // ✅ خط العرض
  lng:              { type: Number },   // ✅ خط الطول
  isNightShift:     { type: Boolean, default: false }
}, { collection: "pharmacists", timestamps: true });

PharmacistSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

PharmacistSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.Pharmacist || mongoose.model('Pharmacist', PharmacistSchema);