// client/src/interfaces/Nurse/NurseHome.jsx
import { useState, useEffect } from "react";
import "./NurseHome.css";

export default function NurseHome({ onNavigate, currentUser }) {
  const [items, setItems]     = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState({ total: 0, onShift: 0, pending: 0 });

  const currentUserId = currentUser?._id || currentUser?.id;

  // دالة باش نجيبو الاسم من أي حقل متاح
  const getDisplayName = (nurse) => {
    return nurse?.fullName || 
           nurse?.name || 
           nurse?.userId || 
           nurse?.gmail || 
           nurse?._id || 
           "Unknown";
  };

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/api/nurse/getAll`)
        .then(r => r.json())
        .catch(() => []),
      fetch(`${process.env.REACT_APP_API_URL}/api/garde/getAll`)
        .then(r => r.json())
        .catch(() => []),
      fetch(`${process.env.REACT_APP_API_URL}/api/demande`)
        .then(r => r.json())
        .catch(() => []),
    ]).then(([nurses, gardes, demandes]) => {
      const nurseList = (Array.isArray(nurses) ? nurses : []).filter(
        n => n._id !== currentUserId
      );
      
      console.log("📋 Nurses list from API:", nurseList);
      
      setItems(nurseList);
      setStats({
        total:   nurseList.length,
        onShift: Array.isArray(gardes)   ? gardes.filter(g => g.role === "nurse").length   : 0,
        pending: Array.isArray(demandes) ? demandes.filter(d => d.role === "nurse" && d.status === "pending").length : 0,
      });
      setLoading(false);
    });
  }, [currentUserId]);

  const filtered = items.filter(i =>
    (i.fullName || i.userId || i.gmail || i.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="nh-container">
      <div className="nh-search-box">
        <h1>Find a Nurse</h1>
        <p>Browse nursing staff</p>
        <div className="nh-search-inner">
          <span className="nh-search-icon">🔍</span>
          <input
            className="nh-search-input"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="nh-main-content">
        <div className="nh-stats">
          <div className="nh-stat-card">
            <div className="nh-stat-label">Total Nurses</div>
            <div className="nh-stat-value">{stats.total}</div>
          </div>
          <div className="nh-stat-card">
            <div className="nh-stat-label">On Shift</div>
            <div className="nh-stat-value">{stats.onShift}</div>
          </div>
          <div className="nh-stat-card">
            <div className="nh-stat-label">Pending</div>
            <div className="nh-stat-value">{stats.pending}</div>
          </div>
        </div>

        <div className="nh-section-title">
          <h3>Nurses List</h3>
          <span className="nh-count">{filtered.length}</span>
        </div>

        {loading ? (
          <div className="nh-loading-wrap">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="nh-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="nh-empty">
            <span>👩‍⚕️</span>
            <p>No nurses found</p>
          </div>
        ) : (
          <div className="nh-list">
            {filtered.map((item, idx) => {
              const displayName = getDisplayName(item);
              return (
                <div
                  key={item._id || idx}
                  className="nh-card"
                  onClick={() => onNavigate?.("profile", item._id)}
                >
                  <div className="nh-card-avatar">👩‍⚕️</div>
                  <div className="nh-card-info">
                    <h4 className="nh-card-name">{displayName}</h4>
                    <p className="nh-card-spec">{item.diplome || item.specialty || "IDE"}</p>
                    <p className="nh-card-loc">📍 {item.service || item.location || "Not specified"}</p>
                  </div>
                  <div className="nh-card-right">
                    <span className={`nh-badge ${item.isAvailable ? "nh-badge-green" : "nh-badge-red"}`}>
                      {item.isAvailable ? "Available" : "Busy"}
                    </span>
                    <span className="nh-arrow">›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}