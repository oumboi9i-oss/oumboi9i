const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Facility = require('../models/Facility');
const records  = require('../data/staticFacilities.json');

async function seed() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/User';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  let saved = 0;
  let skipped = 0;

  for (const record of records) {
    const { osmId, name, type, wilaya, lat, lng, address = '' } = record;

    if (!osmId || !name || !type || !wilaya || lat == null || lng == null) {
      console.warn(`⚠️  Skipping invalid record: ${JSON.stringify(record)}`);
      skipped++;
      continue;
    }

    await Facility.findOneAndUpdate(
      { osmId },
      { name, type, wilaya, lat, lng, address, osmId },
      { upsert: true, new: true }
    );
    console.log(`  ✔ ${wilaya} — ${type} — ${name}`);
    saved++;
  }

  console.log(`\n✅ Done. Upserted: ${saved}  |  Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Fatal:', err); process.exit(1); });