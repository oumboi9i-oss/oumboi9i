// client/src/interfaces/Pharmacist/PharmacistHome.jsx
import { useState, useEffect } from "react";
import "./PharmacistHome.css";

export default function PharmacistHome({ onNavigate, currentUser }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, onShift: 0, pending: 0 });

  const currentUserId = currentUser?._id || currentUser?.id;

  // Fonction bach n3refou smiya dyal l'pharmacist
  const getDisplayName = (pharmacist) => {
    return (
      pharmacist?.fullName ||
      pharmacist?.nomPharmacie ||
      pharmacist?.email ||
      pharmacist?.gmail ||
      "Unknown"
    );
  };

  // Fetch dyal ga3 les pharmacists + les stats
  useEffect(() => {
    const fetchPharmacists = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/pharmacist/getAll");
        const data = await res.json();
        const pharmacists = Array.isArray(data) ? data : [];

        // N7yed l'current user mn la liste
        const filtered = pharmacists.filter((p) => p._id !== currentUserId);

        setItems(filtered);
        setStats((prev) => ({ ...prev, total: filtered.length }));
      } catch (err) {
        console.error("❌ Error fetching pharmacists:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const [gardesRes, demandesRes] = await Promise.all([
          fetch("http://localhost:5000/api/garde/getAll").catch(() => null),
          fetch("http://localhost:5000/api/demande").catch(() => null),
        ]);

        const gardes = gardesRes ? await gardesRes.json() : [];
        const demandes = demandesRes ? await demandesRes.json() : [];

        setStats((prev) => ({
          ...prev,
          onShift: Array.isArray(gardes)
            ? gardes.filter((g) => g.role === "pharmacist").length
            : 0,
          pending: Array.isArray(demandes)
            ? demandes.filter(
                (d) => d.role === "pharmacist" && d.status === "pending"
              ).length
            : 0,
        }));
      } catch (err) {
        console.error("❌ Error fetching stats:", err);
      }
    };

    fetchPharmacists();
    fetchStats();
  }, [currentUserId]);

  // Filter dyal search
  const filtered = items.filter((item) => {
    const text = search.toLowerCase();
    return (
      (item.nomPharmacie || "").toLowerCase().includes(text) ||
      (item.fullName || "").toLowerCase().includes(text) ||
      (item.gmail || "").toLowerCase().includes(text) ||
      (item.email || "").toLowerCase().includes(text)
    );
  });

  // Fonction bach ndkhlo l profile dyal chi pharmacist
  const handleCardClick = (pharmacistId) => {
    if (onNavigate && pharmacistId) {
      onNavigate("profile", pharmacistId);
    }
  };

  return (
    <div className="phmh-container">
      {/* Header w Search */}
      <div className="phmh-search-box">
        <h1>Find a Pharmacist</h1>
        <p>Browse pharmacies</p>
        <div className="phmh-search-inner">
          <span className="phmh-search-icon">🔍</span>
          <input
            className="phmh-search-input"
            placeholder="Search by pharmacy name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="phmh-main-content">
        {/* Stats Cards */}
        <div className="phmh-stats">
          <div className="phmh-stat-card">
            <div className="phmh-stat-label">Total Pharmacists</div>
            <div className="phmh-stat-value">{stats.total}</div>
          </div>
          <div className="phmh-stat-card">
            <div className="phmh-stat-label">On Shift</div>
            <div className="phmh-stat-value">{stats.onShift}</div>
          </div>
          <div className="phmh-stat-card">
            <div className="phmh-stat-label">Pending</div>
            <div className="phmh-stat-value">{stats.pending}</div>
          </div>
        </div>

        {/* Section Title */}
        <div className="phmh-section-title">
          <h3>Pharmacists List</h3>
          <span className="phmh-count">{filtered.length}</span>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="phmh-loading-wrap">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="phmh-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="phmh-empty">
            <span>💊</span>
            <p>No pharmacists found</p>
          </div>
        ) : (
          /* List of Pharmacists */
          <div className="phmh-list">
            {filtered.map((item, idx) => {
              const displayName = getDisplayName(item);
              return (
                <div
                  key={item._id || idx}
                  className="phmh-card"
                  onClick={() => handleCardClick(item._id)}
                >
                  <div className="phmh-card-avatar">💊</div>
                  <div className="phmh-card-info">
                    <h4 className="phmh-card-name">{displayName}</h4>
                    <p className="phmh-card-spec">
                      {item.gmail || item.email || ""}
                    </p>
                    <p className="phmh-card-loc">
                      📍 {item.adressePharmacie || "Not specified"}
                    </p>
                  </div>
                  <div className="phmh-card-right">
                    <span
                      className={`phmh-badge ${
                        item.isAvailable ? "phmh-badge-green" : "phmh-badge-red"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Busy"}
                    </span>
                    <span className="phmh-arrow">›</span>
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