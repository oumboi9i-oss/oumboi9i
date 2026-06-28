// client/src/interfaces/FireFighter/FirefighterHome.jsx
import { useState, useEffect } from "react";
import "./FirefighterHome.css";

export default function FirefighterHome({ onNavigate, currentUser }) {
  const [items, setItems]     = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState({ total: 0, onShift: 0, pending: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/api/firefighter/getAll`)
        .then(r => r.json())
        .catch(() => []),
      fetch(`${process.env.REACT_APP_API_URL}/api/garde/getAll`)
        .then(r => r.json())
        .catch(() => []),
      fetch(`${process.env.REACT_APP_API_URL}/api/demande`)
        .then(r => r.json())
        .catch(() => []),
    ]).then(([firefighters, gardes, demandes]) => {
      const ffList = Array.isArray(firefighters) ? firefighters : [];
      setItems(ffList);
      setStats({
        total:   ffList.length,
        onShift: Array.isArray(gardes)   ? gardes.filter(g => g.role === "firefighter").length   : 0,
        pending: Array.isArray(demandes) ? demandes.filter(d => d.role === "firefighter" && d.status === "pending").length : 0,
      });
      setLoading(false);
    });
  }, []);

  const filtered = items.filter(i =>
    (i.matricule || i.userId || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ffh-container">
      <div className="ffh-search-box">
        <h1>Find a Firefighter</h1>
        <p>Browse firefighting units</p>
        <div className="ffh-search-inner">
          <span className="ffh-search-icon">🔍</span>
          <input
            className="ffh-search-input"
            placeholder="Search by matricule or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ffh-main-content">
        <div className="ffh-stats">
          <div className="ffh-stat-card">
            <div className="ffh-stat-label">Total Firefighters</div>
            <div className="ffh-stat-value">{stats.total}</div>
          </div>
          <div className="ffh-stat-card">
            <div className="ffh-stat-label">On Shift</div>
            <div className="ffh-stat-value">{stats.onShift}</div>
          </div>
          <div className="ffh-stat-card">
            <div className="ffh-stat-label">Pending</div>
            <div className="ffh-stat-value">{stats.pending}</div>
          </div>
        </div>

        <div className="ffh-section-title">
          <h3>Firefighters List</h3>
          <span className="ffh-count">{filtered.length}</span>
        </div>

        {loading ? (
          <div className="ffh-loading-wrap">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="ffh-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="ffh-empty">
            <span>🚒</span>
            <p>No firefighters found</p>
          </div>
        ) : (
          <div className="ffh-list">
            {filtered.map((item, idx) => (
              <div
                key={item._id || idx}
                className="ffh-card"
                onClick={() => onNavigate?.("profile", item._id)}
              >
                <div className="ffh-card-avatar">🚒</div>
                <div className="ffh-card-info">
                  <h4 className="ffh-card-name">{item.matricule || item.userId || "Unknown"}</h4>
                  <p className="ffh-card-spec">{item.rank || ""}</p>
                  <p className="ffh-card-loc">📍 {item.uniteIntervention || "Not specified"}</p>
                </div>
                <div className="ffh-card-right">
                  <span className={`ffh-badge ${item.isAvailable ? "ffh-badge-green" : "ffh-badge-red"}`}>
                    {item.isAvailable ? "Available" : "Busy"}
                  </span>
                  <span className="ffh-arrow">›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}