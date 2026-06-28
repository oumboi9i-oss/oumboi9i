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
  const fetchIdRef          = useRef(0);

  const role         = currentUser?.role;
  const facilityType = ROLE_FACILITY_TYPE[role] || 'hospital';
  const themeColor   = THEME_COLOR[role] || '#2563eb';
  const label        = FACILITY_LABEL[facilityType];
  const icon         = FACILITY_ICON[facilityType];

  const handleWilayaSelect = async (wilayaName) => {
    fetchIdRef.current += 1;
    const currentFetchId = fetchIdRef.current;
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
      if (fetchIdRef.current !== currentFetchId) return;
      setFacilities(res.data || []);
      if (!res.data || res.data.length === 0) {
        setError(`No ${label}s found in this wilaya — try a neighboring wilaya.`);
      }
    } catch {
      if (fetchIdRef.current !== currentFetchId) return;
      setError('Failed to load facilities. Please try again.');
    } finally {
      if (fetchIdRef.current === currentFetchId) setLoading(false);
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

  // Cleanup Leaflet map if component unmounts at any step
  useEffect(() => {
    return () => {
      if (facilityMapInstance.current) {
        facilityMapInstance.current.remove();
        facilityMapInstance.current = null;
      }
    };
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
