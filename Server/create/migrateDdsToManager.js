const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // 1. Update Account collection: role 'dds' → 'manager'
  const accountResult = await mongoose.connection.collection('accounts').updateMany(
    { role: 'dds' },
    { $set: { role: 'manager' } }
  );
  console.log(`✅ accounts updated: ${accountResult.modifiedCount} document(s)`);

  // 2. Update Demande collection: add 'completed' to allowed values is a model fix,
  //    but also fix any directorStatus inconsistencies if needed.
  //    (No data migration needed here — it's a schema fix)

  await mongoose.connection.close();
  console.log('✅ Migration complete. Restart your server now.');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
