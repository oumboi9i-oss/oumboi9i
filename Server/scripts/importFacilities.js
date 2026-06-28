const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Facility = require('../models/Facility');

const CSV_PATH = path.join(__dirname, 'facilities.csv');
const VALID_TYPES = ['hospital', 'pharmacy', 'firestation'];

function parseCSV(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map((line, i) => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, j) => { row[h] = values[j] ?? ''; });
    row._lineNumber = i + 2;
    return row;
  }).filter(row => row.name);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\nCSV file not found: ${CSV_PATH}`);
    console.error('Rename facilities-template.csv to facilities.csv, fill it in, then re-run.\n');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  const rows = parseCSV(CSV_PATH);
  console.log(`Found ${rows.length} rows to import\n`);

  let inserted = 0, updated = 0, skipped = 0;

  for (const row of rows) {
    const { name, type, wilaya, lat, lng, address, _lineNumber } = row;

    if (!name || !type || !wilaya || !lat || !lng) {
      console.warn(`  Line ${_lineNumber}: skipping — missing required field (name/type/wilaya/lat/lng)`);
      skipped++;
      continue;
    }

    if (!VALID_TYPES.includes(type)) {
      console.warn(`  Line ${_lineNumber}: skipping "${name}" — type "${type}" is not one of: ${VALID_TYPES.join(', ')}`);
      skipped++;
      continue;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      console.warn(`  Line ${_lineNumber}: skipping "${name}" — lat/lng are not valid numbers`);
      skipped++;
      continue;
    }

    const osmId = `manual_${slugify(type)}_${slugify(wilaya)}_${slugify(name)}`;

    const doc = { name, type, wilaya, lat: latNum, lng: lngNum, address: address || '', osmId };

    const result = await Facility.findOneAndUpdate({ osmId }, doc, { upsert: true, new: true, rawResult: true });
    if (result.lastErrorObject?.updatedExisting) {
      console.log(`  Updated : ${name} (${type}, ${wilaya})`);
      updated++;
    } else {
      console.log(`  Inserted: ${name} (${type}, ${wilaya})`);
      inserted++;
    }
  }

  console.log(`\nDone — ${inserted} inserted, ${updated} updated, ${skipped} skipped`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
