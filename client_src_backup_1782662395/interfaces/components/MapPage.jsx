// MapPage.jsx - Real GPS coordinates from database
import { useState, useEffect, useRef } from "react";
import "./MapPage.css";

export default function MapPage({ onNavigate, currentUser, role = "doctor" }) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const leafletRef  = useRef(null);
  const [markers, setMarkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [mapReady, setMapReady] = useState(false);
  const [stats, setStats]       = useState({ total: 0, withLocation: 0 });

  const roleConfig = {
    doctor:      { color:"#2563eb", icon:"🧑‍⚕️", label:"Doctors",      api:"http://localhost:5000/api/doctor/getAll",     name:"fullName",     extra: d=>`🩺 ${d.specialty||""}` },
    nurse:       { color:"#10b981", icon:"👩‍⚕️", label:"Nurses",       api:"http://localhost:5000/api/nurse/getAll",      name:"userId",       extra: d=>`🎓 ${d.diplome||""}` },
    pharmacist:  { color:"#059669", icon:"💊",    label:"Pharmacists",  api:"http://localhost:5000/api/pharmacist/getAll", name:"nomPharmacie", extra: d=>`🏪 ${d.nomPharmacie||""}` },
    firefighter: { color:"#ef4444", icon:"🚒",    label:"Firefighters", api:"http://localhost:5000/api/firefighter/getAll",name:"matricule",    extra: d=>`⭐ ${d.grade||""}` },
  };

  const filters = [
    { key:"all",         label:"All",          icon:"🗺️" },
    { key:"doctor",      label:"Doctors",       icon:"🧑‍⚕️" },
    { key:"nurse",       label:"Nurses",        icon:"👩‍⚕️" },
    { key:"pharmacist",  label:"Pharmacists",   icon:"💊"  },
    { key:"firefighter", label:"Firefighters",  icon:"🚒"  },
  ];

// ── Fetch all roles ──
useEffect(() => {
  const fetchAll = async () => {
    setLoading(true);
    const all  = [];
    let total  = 0;
    let withLoc = 0;

    // جلب منطقة المستخدم الحالي
    const currentUserRegion = currentUser?.location || currentUser?.wilaya || currentUser?.region || null;

    for (const [roleKey, cfg] of Object.entries(roleConfig)) {
      try {
        const res  = await fetch(cfg.api);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        total += list.length;

        list.forEach((item, idx) => {
          const name = item[cfg.name] || `${cfg.label} ${idx+1}`;
          const lat  = item.lat ? parseFloat(item.lat) : null;
          const lng  = item.lng ? parseFloat(item.lng) : null;
          
          // جلب منطقة المستخدم الآخر
          const userRegion = item.location || item.wilaya || item.region || null;

          // ✅ تصفية: فقط إذا كان نفس الدور ونفس المنطقة
          if (roleKey !== role) return;
          if (currentUserRegion && userRegion && currentUserRegion !== userRegion) return;

          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

          withLoc++;
          all.push({
            id:       item._id || `${roleKey}-${idx}`,
            role:     roleKey,
            name,
            location: item.location || "",
            email:    item.email || item.gmail || "",
            extra:    cfg.extra(item),
            lat, lng,
            color:    cfg.color,
            icon:     cfg.icon,
          });
        });
      } catch (e) {
        console.warn(`Failed to fetch ${roleKey}:`, e.message);
      }
    }

    setMarkers(all);
    setStats({ total, withLocation: withLoc });
    setLoading(false);
  };

  fetchAll();
}, [role, currentUser]);

  // ── Load Leaflet CSS + JS once ──
  useEffect(() => {
    if (window.L) { setMapReady(true); return; }
    if (document.getElementById("leaflet-css")) return;

    const link = document.createElement("link");
    link.id    = "leaflet-css";
    link.rel   = "stylesheet";
    link.href  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script  = document.createElement("script");
    script.src    = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapReady(true);
    document.body.appendChild(script);
  }, []);

  // ── Init map ──
  useEffect(() => {
    if (!mapReady || loading || mapInstance.current || !mapRef.current) return;
    const L   = window.L;
    const map = L.map(mapRef.current, { zoomControl: true }).setView([28.0, 2.5], 5);
    mapInstance.current = map;
    leafletRef.current  = L;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    renderMarkers(L, map, markers, filter);
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [mapReady, loading]);

  // ── Re-render markers on filter change ──
  useEffect(() => {
    const L   = leafletRef.current;
    const map = mapInstance.current;
    if (!L || !map) return;
    map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });
    renderMarkers(L, map, markers, filter);
  }, [filter, markers]);

  const renderMarkers = (L, map, all, currentFilter) => {
    const visible = currentFilter === "all" ? all : all.filter(m => m.role === currentFilter);
    if (!visible.length) return;

    visible.forEach(m => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          background:${m.color};color:white;border-radius:50%;
          width:40px;height:40px;display:flex;align-items:center;
          justify-content:center;font-size:20px;
          box-shadow:0 3px 14px rgba(0,0,0,0.28);border:3px solid white;cursor:pointer;
        ">${m.icon}</div>`,
        iconSize: [40,40], iconAnchor: [20,20],
      });

      L.marker([m.lat, m.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:'Segoe UI',sans-serif;min-width:190px;padding:4px 2px;">
            <div style="font-size:24px;text-align:center;margin-bottom:8px;">${m.icon}</div>
            <div style="font-weight:700;color:#0f172a;font-size:15px;margin-bottom:5px;">${m.name}</div>
            ${m.extra  ? `<div style="font-size:12px;color:#475569;margin-bottom:4px;">${m.extra}</div>` : ""}
            ${m.email  ? `<div style="font-size:12px;color:#64748b;margin-bottom:4px;">✉️ ${m.email}</div>` : ""}
            ${m.location ? `<div style="font-size:12px;color:#64748b;margin-bottom:8px;">📍 ${m.location}</div>` : ""}
            <div style="
              display:inline-block;padding:3px 12px;margin-top:2px;
              background:${m.color};color:white;border-radius:20px;
              font-size:11px;font-weight:600;text-transform:capitalize;
            ">${m.role}</div>
          </div>
        `, { maxWidth:230 });
    });

    // Fit bounds to visible markers
    try {
      const group = L.featureGroup(visible.map(m => L.marker([m.lat, m.lng])));
      map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 13 });
    } catch(e) {}
  };

  const themeColor = { doctor:"#2563eb", nurse:"#10b981", pharmacist:"#059669", firefighter:"#ef4444" }[role] || "#2563eb";
  const themeBg    = { doctor:"#eff6ff", nurse:"#f0fdf4", pharmacist:"#f0fdf4", firefighter:"#fff1f1" }[role] || "#eff6ff";
  const visibleCount = filter === "all" ? markers.length : markers.filter(m => m.role === filter).length;

  return (
    <div className="map-page">

      {/* TOP BAR */}
      <div className="map-topbar">
        <h2 className="map-topbar-title">🗺️ Map</h2>
        <span className="map-count-badge">{visibleCount} on map</span>
      </div>

      {/* HERO */}
      <div className="map-hero" style={{ background:`linear-gradient(135deg, ${themeColor} 0%, ${themeColor}bb 100%)` }}>
        <h1>📍 Medical Network Map</h1>
        <p>View all healthcare professionals across Algeria</p>
      </div>

      {/* FILTERS */}
      <div className="map-filters-wrap">
        <div className="map-filters">
          {filters.map(f => (
            <button key={f.key}
              className={`map-filter-chip ${filter===f.key?"active":""}`}
              style={filter===f.key ? {background:themeColor, borderColor:themeColor} : {}}
              onClick={() => setFilter(f.key)}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              <span className="map-filter-count">
                {f.key==="all" ? markers.length : markers.filter(m=>m.role===f.key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div className="map-container-wrap">
        {loading ? (
          <div className="map-loading">
            <div className="map-loading-spinner">🗺️</div>
            <p>Loading locations from database...</p>
          </div>
        ) : markers.length === 0 ? (
          <div className="map-loading">
            <div style={{fontSize:48}}>📭</div>
            <p style={{maxWidth:320, textAlign:'center'}}>
              No locations on map yet.<br/>
              Users need to register with their address to appear here.
            </p>
          </div>
        ) : (
          <div ref={mapRef} className="map-container" />
        )}
      </div>

      {/* LEGEND */}
      {!loading && (
        <div className="map-legend">
          {Object.entries(roleConfig).map(([key, cfg]) => (
            <div key={key} className="map-legend-item">
              <span className="map-legend-dot" style={{background:cfg.color}}>{cfg.icon}</span>
              <span className="map-legend-label">{cfg.label}</span>
              <span className="map-legend-num">{markers.filter(m=>m.role===key).length}</span>
            </div>
          ))}
        </div>
      )}

      {/* INFO */}
      {!loading && stats.total > 0 && (
        <div className="map-info-box">
          <span>💡</span>
          <span>
            {stats.withLocation} of {stats.total} users have a location.
            New users appear automatically after signing up with their address.
          </span>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="map-bottom-nav">
        <button className="map-nav-btn" onClick={()=>onNavigate?.("home")}><span>🏠</span><span>Home</span></button>
        <button className="map-nav-btn" onClick={()=>onNavigate?.("messages")||onNavigate?.("message")}><span>💬</span><span>Messages</span></button>
        <button className="map-nav-btn" onClick={()=>onNavigate?.("garde")}><span>🛡️</span><span>Shifts</span></button>
        <button className="map-nav-btn map-nav-active" style={{background:themeBg, color:themeColor}}>
          <span>🗺️</span><span>Map</span>
        </button>
        <button className="map-nav-btn" onClick={()=>onNavigate?.("profile")}><span>👤</span><span>Profile</span></button>
      </div>
    </div>
  );
}