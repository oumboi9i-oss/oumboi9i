// GardeDetailModal.jsx - Shared across Doctor, Nurse, Firefighter, Pharmacist
import { useState, useEffect } from "react";
import "./GardeDetailModal.css";

const ROLE_CONFIG = {
  doctor:      { color: "#2563eb", light: "#eff6ff", avatar: "🧑‍⚕️", label: "Doctor",      api: "doctor"      },
  nurse:       { color: "#10b981", light: "#f0fdf4", avatar: "👩‍⚕️", label: "Nurse",       api: "nurse"       },
  firefighter: { color: "#ef4444", light: "#fff1f1", avatar: "🚒",    label: "Firefighter", api: "firefighter" },
  pharmacist:  { color: "#7c3aed", light: "#f5f3ff", avatar: "💊",    label: "Pharmacist",  api: "pharmacist"  },
};

export default function GardeDetailModal({ garde, currentUser, role = "doctor", onClose, onDemande }) {
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [demandeSent, setDemandeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState("info");

  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.doctor;

  const fmt = d => {
    try { return new Date(d).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
    catch { return d; }
  };

  const getCurrentUserId = () => {
    return currentUser?._id || currentUser?.id || currentUser?.userId || null;
  };

  useEffect(() => {
    if (!garde?.ownerId && !garde?.owner) return;
    setLoadingProfile(true);
    const id = garde.ownerId;
    if (!id) { setLoadingProfile(false); return; }
    fetch(`${process.env.REACT_APP_API_URL}/api/${cfg.api}/${id}`)
      .then(r => r.json())
      .then(data => { setOwnerProfile(data[cfg.api] || data); setLoadingProfile(false); })
      .catch(() => setLoadingProfile(false));
  }, [garde, cfg.api]);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (!garde?._id || !currentUserId) return;
    fetch(`${process.env.REACT_APP_API_URL}/api/demande/check?gardeId=${garde._id}&demandeurId=${currentUserId}`)
      .then(r => r.json())
      .then(data => { if (data.exists) setDemandeSent(true); })
      .catch(() => {});
  }, [garde, currentUser]);

  const handleDemande = async () => {
    console.log('📤 === Starting Demande ===');
    
    const currentUserId = getCurrentUserId();
    
    if (!currentUserId) {
      alert('❌ Error: User ID not found. Please login again.');
      return;
    }

    if (!garde?._id) {
      alert('❌ Error: Garde ID not found.');
      return;
    }

    if (!garde?.ownerId) {
      alert('❌ Error: Garde owner not found.');
      return;
    }

    if (currentUserId === garde.ownerId) {
      alert('❌ You cannot demande your own garde!');
      return;
    }

    setSending(true);
    try {
      const demandeData = {
        gardeId: garde._id,
        gardeDate: garde.dateGarde,
        gardeOwner: garde.owner,
        proprietaireId: garde.ownerId,
        demandeurId: currentUserId,
        demandeurName: currentUser.fullName || currentUser.displayName || currentUser.email || 'User',
        role: currentUser.role || role,
        type: 'echange',
      };

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/demande`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demandeData),
      });

      const data = await res.json();

      if (res.ok) {
        setDemandeSent(true);
        alert('✅ Demande envoyée avec succès!');
        onDemande?.(garde);
      } else {
        alert('❌ ' + (data.message || 'Error sending demande'));
      }
    } catch (error) {
      alert('❌ Network error: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const currentUserId = getCurrentUserId();
  const isOwner = currentUserId === garde?.ownerId || currentUser?.name === garde?.owner;

  if (!garde) return null;

  return (
    <div className="gdm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="gdm-modal" style={{ "--role-color": cfg.color, "--role-light": cfg.light }}>

        <div className="gdm-header" style={{ background: `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color})` }}>
          <div className="gdm-header-left">
            <span className="gdm-big-icon">🛡️</span>
            <div>
              <h2 className="gdm-title">Garde Details</h2>
              <p className="gdm-subtitle">{fmt(garde.dateGarde)}</p>
            </div>
          </div>
          <button className="gdm-close" onClick={onClose}>✕</button>
        </div>

        <div className="gdm-tabs">
          <button className={`gdm-tab ${tab === "info" ? "gdm-tab-active" : ""}`} onClick={() => setTab("info")}>
            📋 Garde Info
          </button>
          <button className={`gdm-tab ${tab === "cv" ? "gdm-tab-active" : ""}`} onClick={() => setTab("cv")}>
            👤 Owner Profile
          </button>
        </div>

        <div className="gdm-body">

          {tab === "info" && (
            <div className="gdm-info-tab">
              <div className={`gdm-status-banner ${garde.status === "Active" ? "gdm-status-active" : "gdm-status-inactive"}`}>
                <span>{garde.status === "Active" ? "✅" : "❌"}</span>
                <span>Status: <strong>{garde.status}</strong></span>
              </div>

              <div className="gdm-info-list">
                {[
                  { icon: "👤", label: "Owner",    val: garde.owner },
                  { icon: "📅", label: "Date",     val: fmt(garde.dateGarde) },
                  { icon: "🏷️", label: "Role",     val: cfg.label },
                  garde.note && { icon: "📝", label: "Note", val: garde.note },
                ].filter(Boolean).map(({ icon, label, val }) => (
                  <div key={label} className="gdm-info-row">
                    <span className="gdm-info-icon" style={{ background: cfg.light }}>{icon}</span>
                    <div className="gdm-info-text">
                      <span className="gdm-info-label">{label}</span>
                      <span className="gdm-info-val">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "cv" && (
            <div className="gdm-cv-tab">
              {loadingProfile ? (
                <div className="gdm-cv-loading">
                  {[1,2,3,4].map(i => <div key={i} className="gdm-skeleton" />)}
                </div>
              ) : ownerProfile ? (
                <>
                  <div className="gdm-cv-hero" style={{ background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`, borderColor: `${cfg.color}33` }}>
                    <span className="gdm-cv-avatar">{cfg.avatar}</span>
                    <div>
                      <h3 className="gdm-cv-name" style={{ color: cfg.color }}>
                        {ownerProfile.fullName || ownerProfile.userId || ownerProfile.matricule || ownerProfile.nomPharmacie || garde.owner}
                      </h3>
                      <p className="gdm-cv-role">{cfg.label}</p>
                    </div>
                  </div>
                  <div className="gdm-info-list">
                    {buildProfileFields(ownerProfile, role).map(({ icon, label, val }) => (
                      <div key={label} className="gdm-info-row">
                        <span className="gdm-info-icon" style={{ background: cfg.light }}>{icon}</span>
                        <div className="gdm-info-text">
                          <span className="gdm-info-label">{label}</span>
                          <span className="gdm-info-val">{val || "Not specified"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="gdm-cv-empty">
                  <span>{cfg.avatar}</span>
                  <p>Profile info not available</p>
                  <small>Owner: <strong>{garde.owner}</strong></small>
                </div>
              )}
            </div>
          )}
        </div>

        {!isOwner && (
          <div className="gdm-footer">
            {demandeSent ? (
              <div className="gdm-demande-sent">
                <span>✅</span>
                <div>
                  <strong>Demande Sent!</strong>
                  <p>Waiting for {garde.owner} to respond</p>
                </div>
              </div>
            ) : (
              <button
                className="gdm-demande-btn"
                style={{ background: cfg.color }}
                onClick={handleDemande}
                disabled={sending || garde.status !== "Active"}
              >
                {sending ? (
                  <span className="gdm-btn-loading">⏳ Sending...</span>
                ) : garde.status !== "Active" ? (
                  "❌ Garde Not Available"
                ) : (
                  <>📤 Demander cette Garde</>
                )}
              </button>
            )}
          </div>
        )}

        {isOwner && (
          <div className="gdm-footer">
            <div className="gdm-owner-badge">
              <span>🛡️</span>
              <div>
                <strong>Your Garde</strong>
                <p>You are the owner of this garde shift</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function buildProfileFields(profile, role) {
  switch (role) {
    case "doctor":
      return [
        { icon: "📧", label: "Email",        val: profile.email },
        { icon: "🩺", label: "Specialty",    val: profile.specialty },
        { icon: "📍", label: "Location",     val: profile.location },
        { icon: "✅", label: "Availability", val: profile.isAvailable ? "Available" : "Busy" },
      ];
    case "nurse":
      return [
        { icon: "✉️", label: "Email",   val: profile.gmail },
        { icon: "🎓", label: "Diploma", val: profile.diplome },
        { icon: "🏥", label: "Service", val: profile.service },
        { icon: "👥", label: "Team",    val: profile.equipe },
      ];
    case "firefighter":
      return [
        { icon: "✉️", label: "Email",      val: profile.gmail },
        { icon: "⭐", label: "Grade",      val: profile.grade },
        { icon: "🚒", label: "Unit",       val: profile.uniteIntervention },
      ];
    case "pharmacist":
      return [
        { icon: "✉️", label: "Email",            val: profile.gmail },
        { icon: "🏪", label: "Pharmacy Name",    val: profile.nomPharmacie },
        { icon: "📍", label: "Pharmacy Address", val: profile.adressePharmacie },
      ];
    default:
      return [];
  }
}