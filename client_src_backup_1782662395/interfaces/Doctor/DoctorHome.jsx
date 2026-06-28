// client/src/interfaces/Doctor/DoctorHome.jsx
import { useState, useEffect } from "react";
import "./DoctorHome.css";

const specialties = ["All", "General", "Surgery", "Pediatrics", "Cardiology", "Orthopedics", "Emergency"];
const specialtyIcons = { All: "🏥", General: "🩺", Surgery: "🔬", Pediatrics: "👶", Cardiology: "❤️", Orthopedics: "🦴", Emergency: "🚑" };

export default function DoctorHome({ onNavigate, currentUser }) {
  const [doctors, setDoctors]               = useState([]);
  const [search, setSearch]                 = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading]               = useState(true);
  const [stats, setStats]                   = useState({ total: 0, onShift: 0, pending: 0 });

  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/api/doctor/getAll")
        .then(r => r.json())
        .catch(() => []),
      fetch("http://localhost:5000/api/garde/getAll")
        .then(r => r.json())
        .catch(() => []),
      fetch("http://localhost:5000/api/demande")
        .then(r => r.json())
        .catch(() => []),
    ]).then(([docs, gardes, demandes]) => {
      const docList = (Array.isArray(docs) ? docs : []).filter(
        d => d._id !== currentUserId
      );
      setDoctors(docList);
      setStats({
        total:   docList.length,
        onShift: Array.isArray(gardes)   ? gardes.filter(g => g.role === "doctor").length   : 0,
        pending: Array.isArray(demandes) ? demandes.filter(d => d.role === "doctor" && d.status === "pending").length : 0,
      });
      setLoading(false);
    });
  }, [currentUserId]);

  const filtered = doctors.filter(d => {
    const matchSearch = d.fullName?.toLowerCase().includes(search.toLowerCase()) || d.specialty?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCategory === "All" || d.specialty === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="dh-container">
      <div className="dh-search-box">
        <h1>Find a Doctor</h1>
        <p>Search by name or specialty</p>
        <div className="dh-search-inner">
          <span className="dh-search-icon">🔍</span>
          <input
            className="dh-search-input"
            placeholder="Search by name or specialty..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dh-main-content">
        <div className="dh-stats">
          <div className="dh-stat-card">
            <div className="dh-stat-label">Total Doctors</div>
            <div className="dh-stat-value">{stats.total}</div>
          </div>
          <div className="dh-stat-card">
            <div className="dh-stat-label">On Shift</div>
            <div className="dh-stat-value">{stats.onShift}</div>
          </div>
          <div className="dh-stat-card">
            <div className="dh-stat-label">Pending</div>
            <div className="dh-stat-value">{stats.pending}</div>
          </div>
        </div>

        <div className="dh-cat-scroll">
          {specialties.map(s => (
            <button
              key={s}
              className={`dh-cat-chip ${activeCategory === s ? "dh-cat-active" : ""}`}
              onClick={() => setActiveCategory(s)}
            >
              <span className="dh-cat-icon">{specialtyIcons[s]}</span>
              <span className="dh-cat-label">{s}</span>
            </button>
          ))}
        </div>

        <div className="dh-section-title">
          <h3>Doctors List</h3>
          <span className="dh-count">{filtered.length}</span>
        </div>

        {loading ? (
          <div className="dh-loading-wrap">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="dh-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="dh-empty">
            <span>🔍</span>
            <p>No doctors found</p>
          </div>
        ) : (
          <div className="dh-list">
            {filtered.map(doc => (
              <div
                key={doc._id}
                className="dh-card"
                onClick={() => onNavigate?.("profile", doc._id)}
              >
                <div className="dh-card-avatar">🧑‍⚕️</div>
                <div className="dh-card-info">
                  <h4 className="dh-card-name">{doc.fullName}</h4>
                  <p className="dh-card-spec">{doc.specialty}</p>
                  <p className="dh-card-loc">📍 {doc.location || "Not specified"}</p>
                </div>
                <div className="dh-card-right">
                  <span className={`dh-badge ${doc.isAvailable ? "dh-badge-green" : "dh-badge-red"}`}>
                    {doc.isAvailable ? "Available" : "Busy"}
                  </span>
                  <span className="dh-arrow">›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}