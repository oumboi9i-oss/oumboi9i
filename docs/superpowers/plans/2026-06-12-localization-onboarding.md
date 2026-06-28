# Localization Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After first login post-approval, users with role doctor/nurse/pharmacist/firefighter must pick their Algerian wilaya on a Leaflet map, then select their specific facility from MongoDB-seeded OSM data, before accessing the dashboard.

**Architecture:** A `locationSet: Boolean` flag on the Account model gates access in App.js. A pre-seeded `Facility` collection (populated by a one-time script from the Overpass API) powers the facility search. Two new frontend components (`AlgeriaMap`, `LocationSetup`) handle the wizard UI using the existing Leaflet CDN pattern.

**Tech Stack:** React 18, Node.js/Express, MongoDB/Mongoose, Leaflet 1.9.4 (CDN), Overpass API (seed-time only), axios.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `Server/models/accountModel.js` | Add `locationSet` field |
| Modify | `Server/models/DoctorModel.js` | Add `wilaya` field |
| Modify | `Server/models/nurseModel.js` | Add `wilaya` field |
| Modify | `Server/models/pharmacistModel.js` | Add `wilaya` field |
| Modify | `Server/models/FireFighters.js` | Add `wilaya` field |
| Modify | `Server/routes/accountRoutes/Login.js` | Include `locationSet` in login response |
| Create | `Server/models/Facility.js` | Facility schema (name, type, wilaya, lat, lng, osmId) |
| Create | `Server/routes/facilityRoutes/getFacilities.js` | `GET /api/facilities` |
| Create | `Server/routes/facilityRoutes/setLocation.js` | `PATCH /api/account/setLocation` |
| Modify | `Server/server.js` | Wire new routes |
| Create | `Server/scripts/seedFacilities.js` | One-time Overpass seed script |
| Create | `client/src/interfaces/user/AlgeriaMap.jsx` | Leaflet map with 48 wilaya circles |
| Create | `client/src/interfaces/user/AlgeriaMap.css` | AlgeriaMap styles |
| Create | `client/src/interfaces/user/LocationSetup.jsx` | Full-screen 2-step wizard |
| Create | `client/src/interfaces/user/LocationSetup.css` | LocationSetup styles |
| Modify | `client/src/App.js` | Add locationSet gate in `getDashboard()` |

---

## Task 1: Add `locationSet` to Account model and login response

**Files:**
- Modify: `Server/models/accountModel.js`
- Modify: `Server/routes/accountRoutes/Login.js`

- [ ] **Step 1: Add `locationSet` field to accountModel**

Open `Server/models/accountModel.js`. After the `isActive` field, add:

```js
  isActive: {
    type: Boolean,
    default: false
  },
  locationSet: {
    type: Boolean,
    default: false
  }
```

- [ ] **Step 2: Include `locationSet` in the login response**

Open `Server/routes/accountRoutes/Login.js`. Find the `res.json({ ... user: { ... } })` block near line 154. The `account` variable is already fetched a few lines above (for the `isActive` check). Add `locationSet` to the user object:

```js
        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: {
                id:    user._id,
                email: user[emailField],
                role:  role.toLowerCase(),
                locationSet: account.locationSet || false,
                ...(role === 'doctor'      && { fullName: user.fullName, specialty: user.specialty }),
                ...(role === 'nurse'       && { userId: user.userId, diplome: user.diplome, service: user.service, equipe: user.equipe }),
                ...(role === 'pharmacist'  && { nomPharmacie: user.nomPharmacie }),
                ...(role === 'firefighter' && { matricule: user.matricule, grade: user.grade }),
                ...(role === 'manager'      && { fullName: user.fullName, position: user.position, managerType: user.managerType })
            }
        });
```

- [ ] **Step 3: Verify server starts without errors**

```bash
cd Server && node -e "require('./models/accountModel'); console.log('OK')"
```
Expected output: `OK`

- [ ] **Step 4: Commit**

```bash
git add Server/models/accountModel.js Server/routes/accountRoutes/Login.js
git commit -m "feat: add locationSet flag to Account model and login response"
```

---

## Task 2: Add `wilaya` field to all four role models

**Files:**
- Modify: `Server/models/DoctorModel.js`
- Modify: `Server/models/nurseModel.js`
- Modify: `Server/models/pharmacistModel.js`
- Modify: `Server/models/FireFighters.js`

- [ ] **Step 1: Add `wilaya` to DoctorModel**

In `Server/models/DoctorModel.js`, after the `location` field add:

```js
  location:    { type: String },
  wilaya:      { type: String },
  lat:         { type: Number },
  lng:         { type: Number },
```

- [ ] **Step 2: Add `wilaya` to nurseModel**

In `Server/models/nurseModel.js`, after the `location` field add:

```js
  location: { type: String },
  wilaya:   { type: String },
  lat:      { type: Number },
  lng:      { type: Number },
```

- [ ] **Step 3: Add `wilaya` to pharmacistModel**

In `Server/models/pharmacistModel.js`, after the `location` field add:

```js
  location:         { type: String },
  wilaya:           { type: String },
  lat:              { type: Number },
  lng:              { type: Number },
```

- [ ] **Step 4: Add `wilaya` to FireFighters**

In `Server/models/FireFighters.js`, after the `location` field add:

```js
  location:          { type: String },
  wilaya:            { type: String },
  lat:               { type: Number },
  lng:               { type: Number },
```

- [ ] **Step 5: Verify all models load**

```bash
cd Server && node -e "require('./models/DoctorModel'); require('./models/nurseModel'); require('./models/pharmacistModel'); require('./models/FireFighters'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add Server/models/DoctorModel.js Server/models/nurseModel.js Server/models/pharmacistModel.js Server/models/FireFighters.js
git commit -m "feat: add wilaya field to role profile models"
```

---

## Task 3: Create the Facility model

**Files:**
- Create: `Server/models/Facility.js`

- [ ] **Step 1: Write the Facility model**

Create `Server/models/Facility.js` with this content:

```js
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
```

- [ ] **Step 2: Verify model loads**

```bash
cd Server && node -e "require('./models/Facility'); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add Server/models/Facility.js
git commit -m "feat: add Facility model for OSM-seeded locations"
```

---

## Task 4: Create `GET /api/facilities` route

**Files:**
- Create: `Server/routes/facilityRoutes/getFacilities.js`

- [ ] **Step 1: Write the route**

Create `Server/routes/facilityRoutes/getFacilities.js`:

```js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Facility = require('../../models/Facility');

router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'your_secret_key');

    const { wilaya, type } = req.query;
    if (!wilaya || !type) {
      return res.status(400).json({ success: false, message: 'wilaya and type query params are required' });
    }

    const facilities = await Facility.find({ wilaya, type }).select('-__v').lean();
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add Server/routes/facilityRoutes/getFacilities.js
git commit -m "feat: add GET /api/facilities route"
```

---

## Task 5: Create `PATCH /api/account/setLocation` route

**Files:**
- Create: `Server/routes/facilityRoutes/setLocation.js`

- [ ] **Step 1: Write the route**

Create `Server/routes/facilityRoutes/setLocation.js`:

```js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Account     = require('../../models/accountModel');
const Doctor      = require('../../models/DoctorModel');
const Nurse       = require('../../models/nurseModel');
const Pharmacist  = require('../../models/pharmacistModel');
const FireFighter = require('../../models/FireFighters');

const ROLE_MODELS = {
  doctor:      { Model: Doctor,      emailField: 'email' },
  nurse:       { Model: Nurse,       emailField: 'gmail' },
  pharmacist:  { Model: Pharmacist,  emailField: 'gmail' },
  firefighter: { Model: FireFighter, emailField: 'gmail' },
};

router.patch('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    const decoded = jwt.verify(
      authHeader.split(' ')[1],
      process.env.JWT_SECRET || 'your_secret_key'
    );
    const { id: profileId, role } = decoded;

    const config = ROLE_MODELS[role];
    if (!config) {
      return res.status(400).json({ success: false, message: 'Role not supported for location setup' });
    }

    const { wilaya, facilityName, lat, lng } = req.body;
    if (!wilaya || !facilityName || lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'wilaya, facilityName, lat, and lng are required' });
    }

    const profile = await config.Model.findByIdAndUpdate(
      profileId,
      { wilaya, location: facilityName, lat, lng },
      { new: true }
    );
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const userEmail = profile[config.emailField];
    await Account.findOneAndUpdate({ email: userEmail }, { locationSet: true });

    res.json({ success: true, message: 'Location saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add Server/routes/facilityRoutes/setLocation.js
git commit -m "feat: add PATCH /api/account/setLocation route"
```

---

## Task 6: Wire new routes into server.js

**Files:**
- Modify: `Server/server.js`

- [ ] **Step 1: Add facility routes**

In `Server/server.js`, after the `// ✅ Demande & Notification Routes` block, add:

```js
// ✅ Facility Routes
app.use('/api/facilities', require('./routes/facilityRoutes/getFacilities'));
app.use('/api/account/setLocation', require('./routes/facilityRoutes/setLocation'));
```

- [ ] **Step 2: Verify server starts**

```bash
cd Server && node -e "require('./server')" 2>&1 | head -5
```
Expected: Lines showing MongoDB connected and server running (no crash).
Press Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add Server/server.js
git commit -m "feat: wire /api/facilities and /api/account/setLocation routes"
```

---

## Task 7: Create the facility seed script

**Files:**
- Create: `Server/scripts/seedFacilities.js`

- [ ] **Step 1: Write the seed script**

Create `Server/scripts/seedFacilities.js`:

```js
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
```

- [ ] **Step 2: Run the seed script (takes ~3 minutes)**

Make sure MongoDB is running and the server `.env` is in place, then:

```bash
cd Server && node scripts/seedFacilities.js
```

Expected output pattern:
```
✅ Connected to MongoDB
  Fetching hospitals in Adrar... 2 saved
  Fetching pharmacys in Adrar... 5 saved
  Fetching firestations in Adrar... 1 saved
  ...
✅ Done. Total facilities saved/updated: 847
```

If a wilaya shows `0 saved` for all types, that's normal for remote wilayas — OSM coverage in southern Algeria is sparse.

- [ ] **Step 3: Verify data in MongoDB**

```bash
cd Server && node -e "
const mongoose = require('mongoose');
const Facility = require('./models/Facility');
mongoose.connect('mongodb://127.0.0.1:27017/User').then(async () => {
  const count = await Facility.countDocuments();
  const sample = await Facility.findOne({ type: 'hospital' });
  console.log('Total:', count);
  console.log('Sample:', JSON.stringify(sample, null, 2));
  mongoose.disconnect();
});
"
```

Expected: Total > 0, sample shows a facility with name, wilaya, lat, lng, osmId.

- [ ] **Step 4: Commit**

```bash
git add Server/scripts/seedFacilities.js
git commit -m "feat: add OSM facility seed script for all 48 wilayas"
```

---

## Task 8: Create the AlgeriaMap component

**Files:**
- Create: `client/src/interfaces/user/AlgeriaMap.jsx`
- Create: `client/src/interfaces/user/AlgeriaMap.css`

- [ ] **Step 1: Create AlgeriaMap.jsx**

Create `client/src/interfaces/user/AlgeriaMap.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react';
import { ALGERIAN_CITIES } from '../../utils/algerianCities';
import './AlgeriaMap.css';

const ALGERIA_CENTER = [28.0, 2.5];
const ALGERIA_ZOOM   = 5;
const CIRCLE_RADIUS  = 45000;
const COLOR_DEFAULT  = '#94a3b8';
const COLOR_HOVER    = '#3b82f6';
const COLOR_SELECTED = '#1d4ed8';

export default function AlgeriaMap({ onSelect, selectedWilaya, themeColor }) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const circlesRef  = useRef({});
  const [mapReady, setMapReady] = useState(!!window.L);

  useEffect(() => {
    if (window.L) { setMapReady(true); return; }
    if (document.getElementById('leaflet-css')) {
      const check = setInterval(() => { if (window.L) { setMapReady(true); clearInterval(check); } }, 100);
      return () => clearInterval(check);
    }
    const link   = document.createElement('link');
    link.id      = 'leaflet-css';
    link.rel     = 'stylesheet';
    link.href    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script    = document.createElement('script');
    script.src      = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload   = () => setMapReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || mapInstance.current || !mapRef.current) return;
    const L   = window.L;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(ALGERIA_CENTER, ALGERIA_ZOOM);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    ALGERIAN_CITIES.forEach(city => {
      const isSelected = selectedWilaya === city.name;
      const circle = L.circle([city.lat, city.lng], {
        radius:      CIRCLE_RADIUS,
        color:       isSelected ? COLOR_SELECTED : COLOR_DEFAULT,
        fillColor:   isSelected ? COLOR_SELECTED : COLOR_DEFAULT,
        fillOpacity: isSelected ? 0.65 : 0.35,
        weight:      isSelected ? 3 : 2,
      }).addTo(map);

      circle.bindTooltip(city.name, { permanent: false, direction: 'top', className: 'wilaya-tooltip' });

      circle.on('mouseover', () => {
        if (city.name !== selectedWilaya) {
          circle.setStyle({ color: COLOR_HOVER, fillColor: COLOR_HOVER, fillOpacity: 0.5 });
        }
      });
      circle.on('mouseout', () => {
        if (city.name !== selectedWilaya) {
          circle.setStyle({ color: COLOR_DEFAULT, fillColor: COLOR_DEFAULT, fillOpacity: 0.35 });
        }
      });
      circle.on('click', () => onSelect(city.name));

      circlesRef.current[city.name] = circle;
    });

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      circlesRef.current = {};
    };
  }, [mapReady]);

  useEffect(() => {
    if (!mapInstance.current) return;
    Object.entries(circlesRef.current).forEach(([name, circle]) => {
      if (name === selectedWilaya) {
        circle.setStyle({ color: COLOR_SELECTED, fillColor: COLOR_SELECTED, fillOpacity: 0.65, weight: 3 });
      } else {
        circle.setStyle({ color: COLOR_DEFAULT, fillColor: COLOR_DEFAULT, fillOpacity: 0.35, weight: 2 });
      }
    });
  }, [selectedWilaya]);

  return (
    <div className="algeria-map-wrap">
      {!mapReady && <div className="algeria-map-loading">Loading map...</div>}
      <div ref={mapRef} className="algeria-map-container" />
    </div>
  );
}
```

- [ ] **Step 2: Create AlgeriaMap.css**

Create `client/src/interfaces/user/AlgeriaMap.css`:

```css
.algeria-map-wrap {
  flex: 1;
  position: relative;
  min-height: 450px;
  display: flex;
  flex-direction: column;
}
.algeria-map-container {
  flex: 1;
  min-height: 450px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.algeria-map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
  font-size: 16px;
  color: #64748b;
  z-index: 1;
}
.wilaya-tooltip {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/interfaces/user/AlgeriaMap.jsx client/src/interfaces/user/AlgeriaMap.css
git commit -m "feat: add AlgeriaMap Leaflet component with 48 wilaya circles"
```

---

## Task 9: Create the LocationSetup wizard component

**Files:**
- Create: `client/src/interfaces/user/LocationSetup.jsx`
- Create: `client/src/interfaces/user/LocationSetup.css`

- [ ] **Step 1: Create LocationSetup.jsx**

Create `client/src/interfaces/user/LocationSetup.jsx`:

```jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AlgeriaMap from './AlgeriaMap';
import { ALGERIAN_CITIES } from '../../utils/algerianCities';
import './LocationSetup.css';

const API_BASE = 'http://localhost:5000/api';

const ROLE_FACILITY_TYPE = {
  doctor:      'hospital',
  nurse:       'hospital',
  pharmacist:  'pharmacy',
  firefighter: 'firestation',
};

const FACILITY_LABEL = {
  hospital:    'Hospital',
  pharmacy:    'Pharmacy',
  firestation: 'Fire Station',
};

const FACILITY_ICON = {
  hospital:    '🏥',
  pharmacy:    '💊',
  firestation: '🚒',
};

const THEME_COLOR = {
  doctor:      '#2563eb',
  nurse:       '#10b981',
  pharmacist:  '#059669',
  firefighter: '#ef4444',
};

export default function LocationSetup({ currentUser, onComplete }) {
  const [step, setStep]                     = useState('wilaya');
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [facilities, setFacilities]         = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [saving, setSaving]                 = useState(false);
  const [facilityMapReady, setFacilityMapReady] = useState(!!window.L);

  const facilityMapRef      = useRef(null);
  const facilityMapInstance = useRef(null);

  const role         = currentUser?.role;
  const facilityType = ROLE_FACILITY_TYPE[role] || 'hospital';
  const themeColor   = THEME_COLOR[role] || '#2563eb';
  const label        = FACILITY_LABEL[facilityType];
  const icon         = FACILITY_ICON[facilityType];

  const handleWilayaSelect = async (wilayaName) => {
    setSelectedWilaya(wilayaName);
    setStep('facility');
    setLoading(true);
    setError('');
    setSelectedFacility(null);
    setFacilities([]);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/facilities`, {
        params:  { wilaya: wilayaName, type: facilityType },
        headers: { Authorization: `Bearer ${token}` },
      });
      setFacilities(res.data || []);
      if (!res.data || res.data.length === 0) {
        setError(`No ${label}s found in ${wilayaName}. Try going back and selecting a neighboring wilaya.`);
      }
    } catch {
      setError('Failed to load facilities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Wait for Leaflet to be available (AlgeriaMap loads it)
  useEffect(() => {
    if (window.L) { setFacilityMapReady(true); return; }
    const interval = setInterval(() => {
      if (window.L) { setFacilityMapReady(true); clearInterval(interval); }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Initialize facility Leaflet map after step changes to 'facility' and DOM renders
  useEffect(() => {
    if (step !== 'facility' || loading || !facilityMapReady) return;

    const initMap = () => {
      if (!facilityMapRef.current) return;

      if (facilityMapInstance.current) {
        facilityMapInstance.current.remove();
        facilityMapInstance.current = null;
      }

      const L      = window.L;
      const city   = ALGERIAN_CITIES.find(c => c.name === selectedWilaya);
      const center = city ? [city.lat, city.lng] : [28.0, 2.5];

      const map = L.map(facilityMapRef.current).setView(center, 11);
      facilityMapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      if (facilities.length > 0) {
        const markers = [];
        facilities.forEach(f => {
          const divIcon = L.divIcon({
            className: '',
            html: `<div style="background:${themeColor};color:white;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 10px rgba(0,0,0,0.3);border:3px solid white;cursor:pointer;">${icon}</div>`,
            iconSize:   [38, 38],
            iconAnchor: [19, 19],
          });

          const marker = L.marker([f.lat, f.lng], { icon: divIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family:'Segoe UI',sans-serif;min-width:160px;"><strong style="font-size:14px;">${f.name}</strong>${f.address ? `<br><span style="font-size:12px;color:#64748b;">${f.address}</span>` : ''}<br><em style="font-size:12px;color:#3b82f6;">Click to select</em></div>`);

          marker.on('click', () => {
            setSelectedFacility(f);
            marker.openPopup();
          });
          markers.push(marker);
        });

        try {
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 13 });
        } catch {}
      }
    };

    // setTimeout(0) ensures the facility map div is painted before Leaflet init
    const t = setTimeout(initMap, 0);
    return () => {
      clearTimeout(t);
      if (facilityMapInstance.current) {
        facilityMapInstance.current.remove();
        facilityMapInstance.current = null;
      }
    };
  }, [step, loading, facilityMapReady, facilities]);

  const handleBack = () => {
    setStep('wilaya');
    setSelectedFacility(null);
    setError('');
    setFacilities([]);
  };

  const handleConfirm = async () => {
    if (!selectedFacility) return;
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE}/account/setLocation`,
        {
          wilaya:       selectedWilaya,
          facilityName: selectedFacility.name,
          lat:          selectedFacility.lat,
          lng:          selectedFacility.lng,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onComplete({
        locationSet: true,
        wilaya:      selectedWilaya,
        location:    selectedFacility.name,
        lat:         selectedFacility.lat,
        lng:         selectedFacility.lng,
      });
    } catch {
      setError('Failed to save location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lsetup">
      <div className="lsetup-header">
        <h1 className="lsetup-title">Set Your Location</h1>
        <div className="lsetup-steps">
          <span className={`lsetup-step ${step === 'wilaya' ? 'lsetup-step--active' : 'lsetup-step--done'}`}>
            1. Select Wilaya
          </span>
          <span className="lsetup-step-arrow">→</span>
          <span className={`lsetup-step ${step === 'facility' ? 'lsetup-step--active' : ''}`}>
            2. Select {label}
          </span>
        </div>
      </div>

      <div className="lsetup-body">
        {step === 'wilaya' && (
          <>
            <p className="lsetup-hint">Click your wilaya on the map to continue</p>
            <AlgeriaMap
              onSelect={handleWilayaSelect}
              selectedWilaya={selectedWilaya}
              themeColor={themeColor}
            />
          </>
        )}

        {step === 'facility' && (
          <>
            <div className="lsetup-nav">
              <button className="lsetup-back-btn" onClick={handleBack}>← Back</button>
              <span className="lsetup-wilaya-tag">{selectedWilaya}</span>
            </div>

            {loading ? (
              <div className="lsetup-state">Loading {label}s...</div>
            ) : error && facilities.length === 0 ? (
              <div className="lsetup-state lsetup-state--error">{error}</div>
            ) : (
              <>
                <p className="lsetup-hint">Click a {icon} pin to select your {label}</p>
                <div ref={facilityMapRef} className="lsetup-facility-map" />
                {selectedFacility && (
                  <div className="lsetup-selected">
                    <strong>Selected:</strong> {selectedFacility.name}
                    {selectedFacility.address && (
                      <span className="lsetup-selected-addr"> — {selectedFacility.address}</span>
                    )}
                  </div>
                )}
                {error && <div className="lsetup-state lsetup-state--error">{error}</div>}
                <button
                  className="lsetup-confirm-btn"
                  style={{ background: themeColor }}
                  onClick={handleConfirm}
                  disabled={!selectedFacility || saving}
                >
                  {saving ? 'Saving...' : `Confirm ${label}`}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create LocationSetup.css**

Create `client/src/interfaces/user/LocationSetup.css`:

```css
.lsetup {
  position: fixed;
  inset: 0;
  background: #ffffff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Segoe UI', sans-serif;
}

.lsetup-header {
  padding: 20px 24px 14px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.lsetup-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px;
}

.lsetup-steps {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.lsetup-step            { color: #94a3b8; }
.lsetup-step--active    { color: #0f172a; font-weight: 600; }
.lsetup-step--done      { color: #22c55e; font-weight: 600; }
.lsetup-step-arrow      { color: #cbd5e1; }

.lsetup-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px 24px 20px;
  gap: 12px;
}

.lsetup-hint {
  font-size: 15px;
  color: #475569;
  margin: 0;
}

.lsetup-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
.lsetup-back-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 14px;
  cursor: pointer;
  color: #475569;
  transition: background 0.15s;
}
.lsetup-back-btn:hover { background: #f1f5f9; }

.lsetup-wilaya-tag {
  background: #f1f5f9;
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.lsetup-facility-map {
  flex: 1;
  min-height: 380px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.lsetup-state {
  padding: 24px;
  text-align: center;
  color: #64748b;
  font-size: 15px;
}
.lsetup-state--error { color: #ef4444; }

.lsetup-selected {
  padding: 12px 16px;
  background: #f0fdf4;
  border-radius: 10px;
  border: 1px solid #bbf7d0;
  font-size: 14px;
  color: #166534;
  flex-shrink: 0;
}
.lsetup-selected-addr { color: #6b7280; }

.lsetup-confirm-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.lsetup-confirm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.lsetup-confirm-btn:not(:disabled):hover { opacity: 0.9; }
```

- [ ] **Step 3: Commit**

```bash
git add client/src/interfaces/user/LocationSetup.jsx client/src/interfaces/user/LocationSetup.css
git commit -m "feat: add LocationSetup wizard component (wilaya + facility picker)"
```

---

## Task 10: Add the `locationSet` gate in App.js

**Files:**
- Modify: `client/src/App.js`

- [ ] **Step 1: Import LocationSetup**

At the top of `client/src/App.js`, after the existing imports, add:

```js
import LocationSetup from './interfaces/user/LocationSetup';
```

- [ ] **Step 2: Add the gate in `getDashboard()`**

In `getDashboard()`, insert the gate block immediately before the `switch` statement. The function currently looks like:

```js
  const getDashboard = () => {
    if (!currentUser) return <Navigate to="/" />;
    const props = { currentUser, onLogout: handleLogout, onUpdateUser: handleUpdateUser };
    switch (currentUser.role) {
```

Change it to:

```js
  const getDashboard = () => {
    if (!currentUser) return <Navigate to="/" />;

    const LOCATION_ROLES = ['doctor', 'nurse', 'pharmacist', 'firefighter'];
    if (!currentUser.locationSet && LOCATION_ROLES.includes(currentUser.role)) {
      return (
        <LocationSetup
          currentUser={currentUser}
          onComplete={(data) => handleUpdateUser(data)}
        />
      );
    }

    const props = { currentUser, onLogout: handleLogout, onUpdateUser: handleUpdateUser };
    switch (currentUser.role) {
```

- [ ] **Step 3: Verify the client compiles**

```bash
cd client && npm start
```

Expected: Compiles successfully, no errors in terminal. Open http://localhost:3000. Ctrl+C to stop after confirming no compile errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.js
git commit -m "feat: gate dashboard on locationSet for field roles"
```

---

## Task 11: End-to-end smoke test

- [ ] **Step 1: Start both server and client**

```bash
# Terminal 1
cd Server && node server.js

# Terminal 2
cd client && npm start
```

- [ ] **Step 2: Test the happy path**

1. Sign up a new account with role `doctor`.
2. Log in as admin and approve the account (`isActive: true`).
3. Log in as the doctor account.
4. **Expected:** LocationSetup screen appears (not the dashboard).
5. Click any wilaya circle on the map.
6. **Expected:** Step transitions to facility picker; Leaflet map zooms to that wilaya; hospital pins appear.
7. Click a hospital pin.
8. **Expected:** "Selected: [name]" bar appears below the map.
9. Click "Confirm Hospital".
10. **Expected:** Dashboard appears. LocationSetup does not reappear.

- [ ] **Step 3: Test the empty-wilaya edge case**

Log out. Log in again as doctor (now `locationSet: true`).
**Expected:** Dashboard appears immediately — no LocationSetup shown.

- [ ] **Step 4: Test the back button**

Log out. Create a new unapproved doctor account, approve it, log in.
On LocationSetup step 2, click "← Back".
**Expected:** Returns to wilaya map (step 1). Previously selected wilaya remains highlighted (intentional — helps user orient themselves).

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "test: verify localization onboarding end-to-end"
```
---

## Task 12: Seed static/manual facility data for wilayas with sparse OSM coverage

**Why this task exists:**
The Overpass API (Task 7) returns 0 results for many eastern and inland wilayas (Oum El Bouaghi, Khenchela, Mila, Souk Ahras, etc.) because OSM coverage in Algeria is incomplete. This task adds a curated static JSON file with known hospitals, pharmacies, and fire stations for those wilayas. The seed script reads the JSON and upserts records — same `osmId` uniqueness logic as Task 7, so re-running is always safe.

**Files:**
- Create: `Server/data/staticFacilities.json`
- Create: `Server/scripts/seedStaticFacilities.js`

---

### File Map addition

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `Server/data/staticFacilities.json` | Curated static facility records |
| Create | `Server/scripts/seedStaticFacilities.js` | Script to upsert static records into MongoDB |

---

- [ ] **Step 1: Create the data directory and copy the JSON file**

```bash
mkdir -p Server/data
```

Then create `Server/data/staticFacilities.json` with the following content (add/edit entries freely — each `osmId` must be unique and start with `static/`):

```json
[
  {
    "osmId": "static/oum-el-bouaghi-hospital-1",
    "name": "مستشفى أم البواقي",
    "type": "hospital",
    "wilaya": "Oum El Bouaghi",
    "lat": 35.8731,
    "lng": 7.1128,
    "address": "أم البواقي"
  },
  {
    "osmId": "static/oum-el-bouaghi-hospital-2",
    "name": "مستشفى عين مليلة",
    "type": "hospital",
    "wilaya": "Oum El Bouaghi",
    "lat": 36.0320,
    "lng": 6.5700,
    "address": "عين مليلة، أم البواقي"
  },
  {
    "osmId": "static/oum-el-bouaghi-hospital-3",
    "name": "مستشفى عين البيضاء",
    "type": "hospital",
    "wilaya": "Oum El Bouaghi",
    "lat": 35.7939,
    "lng": 7.4056,
    "address": "عين البيضاء، أم البواقي"
  },
  {
    "osmId": "static/oum-el-bouaghi-pharmacy-1",
    "name": "صيدلية الهلال",
    "type": "pharmacy",
    "wilaya": "Oum El Bouaghi",
    "lat": 35.8750,
    "lng": 7.1140,
    "address": "شارع العقيد عميروش، أم البواقي"
  },
  {
    "osmId": "static/oum-el-bouaghi-pharmacy-2",
    "name": "صيدلية النور",
    "type": "pharmacy",
    "wilaya": "Oum El Bouaghi",
    "lat": 35.8700,
    "lng": 7.1090,
    "address": "أم البواقي"
  },
  {
    "osmId": "static/oum-el-bouaghi-pharmacy-3",
    "name": "صيدلية عين مليلة المركزية",
    "type": "pharmacy",
    "wilaya": "Oum El Bouaghi",
    "lat": 36.0330,
    "lng": 6.5720,
    "address": "عين مليلة، أم البواقي"
  },
  {
    "osmId": "static/oum-el-bouaghi-firestation-1",
    "name": "ثكنة الحماية المدنية أم البواقي",
    "type": "firestation",
    "wilaya": "Oum El Bouaghi",
    "lat": 35.8720,
    "lng": 7.1100,
    "address": "أم البواقي"
  },
  {
    "osmId": "static/oum-el-bouaghi-firestation-2",
    "name": "ثكنة الحماية المدنية عين مليلة",
    "type": "firestation",
    "wilaya": "Oum El Bouaghi",
    "lat": 36.0310,
    "lng": 6.5690,
    "address": "عين مليلة، أم البواقي"
  },
  {
    "osmId": "static/constantine-hospital-1",
    "name": "مستشفى ابن باديس الجامعي",
    "type": "hospital",
    "wilaya": "Constantine",
    "lat": 36.3600,
    "lng": 6.6100,
    "address": "شارع زيغود يوسف، قسنطينة"
  },
  {
    "osmId": "static/constantine-hospital-2",
    "name": "مستشفى الحكيم سعدان",
    "type": "hospital",
    "wilaya": "Constantine",
    "lat": 36.3700,
    "lng": 6.6200,
    "address": "قسنطينة"
  },
  {
    "osmId": "static/constantine-hospital-3",
    "name": "مستشفى الأم والطفل",
    "type": "hospital",
    "wilaya": "Constantine",
    "lat": 36.3650,
    "lng": 6.6050,
    "address": "قسنطينة"
  },
  {
    "osmId": "static/constantine-pharmacy-1",
    "name": "صيدلية المنصورة",
    "type": "pharmacy",
    "wilaya": "Constantine",
    "lat": 36.3580,
    "lng": 6.6080,
    "address": "حي المنصورة، قسنطينة"
  },
  {
    "osmId": "static/constantine-pharmacy-2",
    "name": "صيدلية علي منجلي",
    "type": "pharmacy",
    "wilaya": "Constantine",
    "lat": 36.3200,
    "lng": 6.5800,
    "address": "حي علي منجلي، قسنطينة"
  },
  {
    "osmId": "static/constantine-firestation-1",
    "name": "ثكنة الحماية المدنية قسنطينة",
    "type": "firestation",
    "wilaya": "Constantine",
    "lat": 36.3620,
    "lng": 6.6130,
    "address": "قسنطينة"
  },
  {
    "osmId": "static/constantine-firestation-2",
    "name": "ثكنة الحماية المدنية علي منجلي",
    "type": "firestation",
    "wilaya": "Constantine",
    "lat": 36.3180,
    "lng": 6.5770,
    "address": "حي علي منجلي، قسنطينة"
  },
  {
    "osmId": "static/setif-hospital-1",
    "name": "المستشفى الجامعي سطيف",
    "type": "hospital",
    "wilaya": "Setif",
    "lat": 36.1870,
    "lng": 5.4080,
    "address": "سطيف"
  },
  {
    "osmId": "static/setif-hospital-2",
    "name": "مستشفى العيون سطيف",
    "type": "hospital",
    "wilaya": "Setif",
    "lat": 36.1910,
    "lng": 5.4120,
    "address": "سطيف"
  },
  {
    "osmId": "static/setif-pharmacy-1",
    "name": "صيدلية عين أزال",
    "type": "pharmacy",
    "wilaya": "Setif",
    "lat": 36.1830,
    "lng": 5.4040,
    "address": "سطيف"
  },
  {
    "osmId": "static/setif-firestation-1",
    "name": "ثكنة الحماية المدنية سطيف",
    "type": "firestation",
    "wilaya": "Setif",
    "lat": 36.1850,
    "lng": 5.4060,
    "address": "سطيف"
  },
  {
    "osmId": "static/batna-hospital-1",
    "name": "المستشفى الجامعي باتنة",
    "type": "hospital",
    "wilaya": "Batna",
    "lat": 35.5560,
    "lng": 6.1740,
    "address": "باتنة"
  },
  {
    "osmId": "static/batna-hospital-2",
    "name": "مستشفى سيدي معروف",
    "type": "hospital",
    "wilaya": "Batna",
    "lat": 35.5620,
    "lng": 6.1800,
    "address": "باتنة"
  },
  {
    "osmId": "static/batna-pharmacy-1",
    "name": "صيدلية الشفاء باتنة",
    "type": "pharmacy",
    "wilaya": "Batna",
    "lat": 35.5570,
    "lng": 6.1750,
    "address": "باتنة"
  },
  {
    "osmId": "static/batna-firestation-1",
    "name": "ثكنة الحماية المدنية باتنة",
    "type": "firestation",
    "wilaya": "Batna",
    "lat": 35.5540,
    "lng": 6.1720,
    "address": "باتنة"
  },
  {
    "osmId": "static/annaba-hospital-1",
    "name": "مستشفى ابن سينا عنابة",
    "type": "hospital",
    "wilaya": "Annaba",
    "lat": 36.8980,
    "lng": 7.7640,
    "address": "عنابة"
  },
  {
    "osmId": "static/annaba-hospital-2",
    "name": "مستشفى الإخوة مرسلي",
    "type": "hospital",
    "wilaya": "Annaba",
    "lat": 36.9020,
    "lng": 7.7680,
    "address": "عنابة"
  },
  {
    "osmId": "static/annaba-pharmacy-1",
    "name": "صيدلية عنابة المركزية",
    "type": "pharmacy",
    "wilaya": "Annaba",
    "lat": 36.9000,
    "lng": 7.7660,
    "address": "عنابة"
  },
  {
    "osmId": "static/annaba-firestation-1",
    "name": "ثكنة الحماية المدنية عنابة",
    "type": "firestation",
    "wilaya": "Annaba",
    "lat": 36.8960,
    "lng": 7.7620,
    "address": "عنابة"
  },
  {
    "osmId": "static/guelma-hospital-1",
    "name": "مستشفى قالمة",
    "type": "hospital",
    "wilaya": "Guelma",
    "lat": 36.4622,
    "lng": 7.4328,
    "address": "قالمة"
  },
  {
    "osmId": "static/guelma-pharmacy-1",
    "name": "صيدلية قالمة",
    "type": "pharmacy",
    "wilaya": "Guelma",
    "lat": 36.4630,
    "lng": 7.4340,
    "address": "قالمة"
  },
  {
    "osmId": "static/guelma-firestation-1",
    "name": "ثكنة الحماية المدنية قالمة",
    "type": "firestation",
    "wilaya": "Guelma",
    "lat": 36.4610,
    "lng": 7.4310,
    "address": "قالمة"
  },
  {
    "osmId": "static/skikda-hospital-1",
    "name": "مستشفى سكيكدة",
    "type": "hospital",
    "wilaya": "Skikda",
    "lat": 36.8783,
    "lng": 6.9058,
    "address": "سكيكدة"
  },
  {
    "osmId": "static/skikda-pharmacy-1",
    "name": "صيدلية سكيكدة",
    "type": "pharmacy",
    "wilaya": "Skikda",
    "lat": 36.8800,
    "lng": 6.9070,
    "address": "سكيكدة"
  },
  {
    "osmId": "static/skikda-firestation-1",
    "name": "ثكنة الحماية المدنية سكيكدة",
    "type": "firestation",
    "wilaya": "Skikda",
    "lat": 36.8760,
    "lng": 6.9040,
    "address": "سكيكدة"
  },
  {
    "osmId": "static/souk-ahras-hospital-1",
    "name": "مستشفى سوق أهراس",
    "type": "hospital",
    "wilaya": "Souk Ahras",
    "lat": 36.2864,
    "lng": 7.9511,
    "address": "سوق أهراس"
  },
  {
    "osmId": "static/souk-ahras-pharmacy-1",
    "name": "صيدلية سوق أهراس",
    "type": "pharmacy",
    "wilaya": "Souk Ahras",
    "lat": 36.2870,
    "lng": 7.9520,
    "address": "سوق أهراس"
  },
  {
    "osmId": "static/souk-ahras-firestation-1",
    "name": "ثكنة الحماية المدنية سوق أهراس",
    "type": "firestation",
    "wilaya": "Souk Ahras",
    "lat": 36.2850,
    "lng": 7.9500,
    "address": "سوق أهراس"
  },
  {
    "osmId": "static/tebessa-hospital-1",
    "name": "مستشفى تبسة",
    "type": "hospital",
    "wilaya": "Tebessa",
    "lat": 35.4042,
    "lng": 8.1244,
    "address": "تبسة"
  },
  {
    "osmId": "static/tebessa-pharmacy-1",
    "name": "صيدلية تبسة",
    "type": "pharmacy",
    "wilaya": "Tebessa",
    "lat": 35.4050,
    "lng": 8.1260,
    "address": "تبسة"
  },
  {
    "osmId": "static/tebessa-firestation-1",
    "name": "ثكنة الحماية المدنية تبسة",
    "type": "firestation",
    "wilaya": "Tebessa",
    "lat": 35.4030,
    "lng": 8.1230,
    "address": "تبسة"
  },
  {
    "osmId": "static/khenchela-hospital-1",
    "name": "مستشفى خنشلة",
    "type": "hospital",
    "wilaya": "Khenchela",
    "lat": 35.4350,
    "lng": 7.1428,
    "address": "خنشلة"
  },
  {
    "osmId": "static/khenchela-pharmacy-1",
    "name": "صيدلية خنشلة",
    "type": "pharmacy",
    "wilaya": "Khenchela",
    "lat": 35.4360,
    "lng": 7.1440,
    "address": "خنشلة"
  },
  {
    "osmId": "static/khenchela-firestation-1",
    "name": "ثكنة الحماية المدنية خنشلة",
    "type": "firestation",
    "wilaya": "Khenchela",
    "lat": 35.4340,
    "lng": 7.1410,
    "address": "خنشلة"
  },
  {
    "osmId": "static/mila-hospital-1",
    "name": "مستشفى ميلة",
    "type": "hospital",
    "wilaya": "Mila",
    "lat": 36.4500,
    "lng": 6.2667,
    "address": "ميلة"
  },
  {
    "osmId": "static/mila-pharmacy-1",
    "name": "صيدلية ميلة",
    "type": "pharmacy",
    "wilaya": "Mila",
    "lat": 36.4510,
    "lng": 6.2680,
    "address": "ميلة"
  },
  {
    "osmId": "static/mila-firestation-1",
    "name": "ثكنة الحماية المدنية ميلة",
    "type": "firestation",
    "wilaya": "Mila",
    "lat": 36.4490,
    "lng": 6.2650,
    "address": "ميلة"
  },
  {
    "osmId": "static/jijel-hospital-1",
    "name": "مستشفى جيجل",
    "type": "hospital",
    "wilaya": "Jijel",
    "lat": 36.8200,
    "lng": 5.7667,
    "address": "جيجل"
  },
  {
    "osmId": "static/jijel-pharmacy-1",
    "name": "صيدلية جيجل",
    "type": "pharmacy",
    "wilaya": "Jijel",
    "lat": 36.8210,
    "lng": 5.7680,
    "address": "جيجل"
  },
  {
    "osmId": "static/jijel-firestation-1",
    "name": "ثكنة الحماية المدنية جيجل",
    "type": "firestation",
    "wilaya": "Jijel",
    "lat": 36.8190,
    "lng": 5.7650,
    "address": "جيجل"
  },
  {
    "osmId": "static/bordj-bou-arreridj-hospital-1",
    "name": "مستشفى برج بوعريريج",
    "type": "hospital",
    "wilaya": "Bordj Bou Arreridj",
    "lat": 36.0731,
    "lng": 4.7631,
    "address": "برج بوعريريج"
  },
  {
    "osmId": "static/bordj-bou-arreridj-pharmacy-1",
    "name": "صيدلية برج بوعريريج",
    "type": "pharmacy",
    "wilaya": "Bordj Bou Arreridj",
    "lat": 36.0740,
    "lng": 4.7645,
    "address": "برج بوعريريج"
  },
  {
    "osmId": "static/bordj-bou-arreridj-firestation-1",
    "name": "ثكنة الحماية المدنية برج بوعريريج",
    "type": "firestation",
    "wilaya": "Bordj Bou Arreridj",
    "lat": 36.0720,
    "lng": 4.7615,
    "address": "برج بوعريريج"
  },
  {
    "osmId": "static/msila-hospital-1",
    "name": "مستشفى المسيلة",
    "type": "hospital",
    "wilaya": "Msila",
    "lat": 35.7050,
    "lng": 4.5444,
    "address": "المسيلة"
  },
  {
    "osmId": "static/msila-pharmacy-1",
    "name": "صيدلية المسيلة",
    "type": "pharmacy",
    "wilaya": "Msila",
    "lat": 35.7060,
    "lng": 4.5460,
    "address": "المسيلة"
  },
  {
    "osmId": "static/msila-firestation-1",
    "name": "ثكنة الحماية المدنية المسيلة",
    "type": "firestation",
    "wilaya": "Msila",
    "lat": 35.7040,
    "lng": 4.5430,
    "address": "المسيلة"
  }
]
```

> **💡 How to add more entries:** Duplicate any block, give it a unique `osmId` like `static/wilaya-name-type-N`, update the name/coords, and save. Re-running the script will upsert without duplicating.

---

- [ ] **Step 2: Write the seed script**

Create `Server/scripts/seedStaticFacilities.js`:

```js
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
```

---

- [ ] **Step 3: Run the script**

```bash
cd Server && node scripts/seedStaticFacilities.js
```

Expected output:
```
✅ Connected to MongoDB
  ✔ Oum El Bouaghi — hospital — مستشفى أم البواقي
  ✔ Oum El Bouaghi — hospital — مستشفى عين مليلة
  ...
✅ Done. Upserted: 52  |  Skipped: 0
```

> Re-running the script any time is safe — it uses `upsert` so existing records are updated, not duplicated.

---

- [ ] **Step 4: Verify in MongoDB**

```bash
cd Server && node -e "
const mongoose = require('mongoose');
const Facility = require('./models/Facility');
mongoose.connect('mongodb://127.0.0.1:27017/User').then(async () => {
  const total  = await Facility.countDocuments();
  const static_ = await Facility.countDocuments({ osmId: /^static\// });
  const oumBw  = await Facility.find({ wilaya: 'Oum El Bouaghi' });
  console.log('Total facilities:', total);
  console.log('Static records:',  static_);
  console.log('Oum El Bouaghi:', oumBw.map(f => f.name));
  mongoose.disconnect();
});
"
```

Expected: Static records > 0, Oum El Bouaghi list shows the Arabic names.

---

- [ ] **Step 5: Commit**

```bash
git add Server/data/staticFacilities.json Server/scripts/seedStaticFacilities.js
git commit -m "feat: add static facility seed data and script for sparse-OSM wilayas"
```

---

### Wilayas covered by static data (initial set)

| Wilaya | Hospitals | Pharmacies | Fire Stations |
|--------|-----------|------------|---------------|
| Oum El Bouaghi | 3 | 3 | 2 |
| Constantine | 3 | 2 | 2 |
| Setif | 2 | 1 | 1 |
| Batna | 2 | 1 | 1 |
| Annaba | 2 | 1 | 1 |
| Guelma | 1 | 1 | 1 |
| Skikda | 1 | 1 | 1 |
| Souk Ahras | 1 | 1 | 1 |
| Tebessa | 1 | 1 | 1 |
| Khenchela | 1 | 1 | 1 |
| Mila | 1 | 1 | 1 |
| Jijel | 1 | 1 | 1 |
| Bordj Bou Arreridj | 1 | 1 | 1 |
| Msila | 1 | 1 | 1 |

> Add more entries to `staticFacilities.json` as needed — no code changes required.