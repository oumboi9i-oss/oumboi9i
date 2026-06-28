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
