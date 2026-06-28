const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const https = require('https');
const mongoose = require('mongoose');
const Facility = require('../models/Facility');

const WILAYAS = [
  { name: "Adrar",                  lat: 27.8742, lng: 0.2942  },
  { name: "Ain Defla",              lat: 36.2640, lng: 1.9673  },
  { name: "Ain Temouchent",         lat: 35.2980, lng: -1.1396 },
  { name: "Alger",                  lat: 36.7538, lng: 3.0588  },
  { name: "Annaba",                 lat: 36.9000, lng: 7.7667  },
  { name: "Batna",                  lat: 35.5560, lng: 6.1740  },
  { name: "Bechar",                 lat: 31.6238, lng: -2.2166 },
  { name: "Bejaia",                 lat: 36.7515, lng: 5.0564  },
  { name: "Biskra",                 lat: 34.8500, lng: 5.7333  },
  { name: "Blida",                  lat: 36.4700, lng: 2.8300  },
  { name: "Bordj Bou Arreridj",     lat: 36.0731, lng: 4.7631  },
  { name: "Bouira",                 lat: 36.3800, lng: 3.9000  },
  { name: "Boumerdes",              lat: 36.7640, lng: 3.4773  },
  { name: "Chlef",                  lat: 36.1650, lng: 1.3317  },
  { name: "Constantine",            lat: 36.3650, lng: 6.6147  },
  { name: "Djelfa",                 lat: 34.6706, lng: 3.2630  },
  { name: "El Bayadh",              lat: 33.6831, lng: 1.0228  },
  { name: "El Oued",                lat: 33.3569, lng: 6.8633  },
  { name: "El Tarf",                lat: 36.7673, lng: 8.3131  },
  { name: "Ghardaia",               lat: 32.4900, lng: 3.6700  },
  { name: "Guelma",                 lat: 36.4622, lng: 7.4328  },
  { name: "Illizi",                 lat: 26.5069, lng: 8.4769  },
  { name: "Jijel",                  lat: 36.8200, lng: 5.7667  },
  { name: "Khenchela",              lat: 35.4350, lng: 7.1428  },
  { name: "Laghouat",               lat: 33.8000, lng: 2.8833  },
  { name: "Mascara",                lat: 35.3951, lng: 0.1403  },
  { name: "Medea",                  lat: 36.2640, lng: 2.7528  },
  { name: "Mila",                   lat: 36.4500, lng: 6.2667  },
  { name: "Mostaganem",             lat: 35.9317, lng: 0.0892  },
  { name: "Msila",                  lat: 35.7050, lng: 4.5444  },
  { name: "Naama",                  lat: 33.2672, lng: -0.3133 },
  { name: "Oran",                   lat: 35.6969, lng: -0.6331 },
  { name: "Ouargla",                lat: 31.9500, lng: 5.3167  },
  { name: "Oum El Bouaghi",         lat: 35.8731, lng: 7.1128  },
  { name: "Relizane",               lat: 35.7333, lng: 0.5569  },
  { name: "Saida",                  lat: 34.8306, lng: 0.1511  },
  { name: "Setif",                  lat: 36.1900, lng: 5.4100  },
  { name: "Sidi Bel Abbes",         lat: 35.1900, lng: -0.6300 },
  { name: "Skikda",                 lat: 36.8783, lng: 6.9058  },
  { name: "Souk Ahras",             lat: 36.2864, lng: 7.9511  },
  { name: "Tamanrasset",            lat: 22.7853, lng: 5.5228  },
  { name: "Tebessa",                lat: 35.4042, lng: 8.1244  },
  { name: "Tiaret",                 lat: 35.3706, lng: 1.3178  },
  { name: "Tindouf",                lat: 27.6742, lng: -8.1478 },
  { name: "Tipaza",                 lat: 36.5894, lng: 2.4469  },
  { name: "Tissemsilt",             lat: 35.6058, lng: 1.8114  },
  { name: "Tizi Ouzou",             lat: 36.7169, lng: 4.0497  },
  { name: "Tlemcen",                lat: 34.8800, lng: -1.3200 },
  { name: "Touggourt",              lat: 33.1000, lng: 6.0667  },
];

const FACILITY_TYPES = [
  { type: 'hospital',    amenity: 'hospital'      },
  { type: 'pharmacy',    amenity: 'pharmacy'      },
  { type: 'firestation', amenity: 'fire_station'  },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function overpassFetch(lat, lng, amenity) {
  const query = `[out:json][timeout:30];(node["amenity"="${amenity}"](around:50000,${lat},${lng});way["amenity"="${amenity}"](around:50000,${lat},${lng}););out center;`;
  const body  = `data=${encodeURIComponent(query)}`;
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'overpass-api.de',
      path:     '/api/interpreter',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse failed: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function seed() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/User';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  let totalSaved = 0;

  for (const wilaya of WILAYAS) {
    for (const { type, amenity } of FACILITY_TYPES) {
      try {
        process.stdout.write(`  Fetching ${type}s in ${wilaya.name}... `);
        const result   = await overpassFetch(wilaya.lat, wilaya.lng, amenity);
        const elements = result.elements || [];
        let count = 0;

        for (const el of elements) {
          const lat  = el.lat  ?? el.center?.lat;
          const lon  = el.lon  ?? el.center?.lon;
          if (lat == null || lon == null) continue;

          const name    = el.tags?.name || el.tags?.['name:ar'] || el.tags?.['name:fr'] || `${type} (${wilaya.name})`;
          const address = el.tags?.['addr:full'] || el.tags?.['addr:street'] || '';
          const osmId   = `${el.type}/${el.id}`;

          await Facility.findOneAndUpdate(
            { osmId },
            { name, type, wilaya: wilaya.name, lat, lng: lon, address, osmId },
            { upsert: true, new: true }
          );
          count++;
        }

        totalSaved += count;
        console.log(`${count} saved`);
        await sleep(2000);
      } catch (err) {
        console.log(`FAILED — ${err.message}`);
      }
    }
  }

  console.log(`\n✅ Done. Total facilities saved/updated: ${totalSaved}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Fatal:', err); process.exit(1); });
