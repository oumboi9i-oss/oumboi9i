import { useState, useEffect } from "react";

// ── Inline styles — no external CSS needed ──────────────────────────────────
const S = {
  page: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    minHeight: "100vh",
    background: "#F0FDF4",
    width: "100%",
    paddingBottom: 0,
  },
  toast: (type) => ({
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 24px",
    borderRadius: 50,
    fontSize: 13,
    fontWeight: 700,
    zIndex: 999,
    whiteSpace: "nowrap",
    background: type === "success" ? "#DCFCE7" : "#FEE2E2",
    color: type === "success" ? "#15803D" : "#DC2626",
    border: `1px solid ${type === "success" ? "#86EFAC" : "#FCA5A5"}`,
    animation: "slideIn 0.3s ease",
  }),
  hero: {
    background: "linear-gradient(145deg, #065F46 0%, #10B981 100%)",
    padding: "52px 20px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    background: "rgba(255,255,255,0.18)",
    border: "none",
    borderRadius: 50,
    padding: "7px 16px",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  avatar: {
    width: 88,
    height: 88,
    background: "rgba(255,255,255,0.15)",
    borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 42,
    marginBottom: 6,
  },
  heroName: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    margin: 0,
  },
  heroBadge: {
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 14px",
    borderRadius: 50,
    letterSpacing: "0.4px",
  },
  heroMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#6EE7B7",
    boxShadow: "0 0 0 2px rgba(110,231,183,0.35)",
    display: "inline-block",
  },
  main: {
    padding: "20px 16px",
    maxWidth: 480,
    margin: "0 auto",
  },
  infoCard: {
    background: "#fff",
    border: "1.5px solid #D1FAE5",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    boxShadow: "0 2px 16px rgba(16,185,129,0.07)",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "15px 18px",
    borderBottom: "1px solid #F0FDF4",
    transition: "background 0.15s",
  },
  iconWrap: {
    width: 44,
    height: 44,
    background: "#DCFCE7",
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0F172A",
  },
  actions: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
  },
  btnEdit: {
    flex: 1,
    padding: "14px",
    border: "none",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: "#10B981",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(16,185,129,0.28)",
    transition: "all 0.2s",
  },
  btnDelete: {
    padding: "14px 20px",
    border: "none",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#FFF1F2",
    color: "#E11D48",
    transition: "all 0.2s",
  },
  editCard: {
    background: "#fff",
    border: "1.5px solid #D1FAE5",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    boxShadow: "0 2px 16px rgba(16,185,129,0.07)",
  },
  editTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0F172A",
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: "1px solid #F0FDF4",
  },
  formGroup: { marginBottom: 14 },
  formLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: 6,
  },
  formInput: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #D1FAE5",
    borderRadius: 11,
    fontSize: 14,
    color: "#0F172A",
    fontFamily: "inherit",
    background: "#F8FAFC",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.15s",
  },
  editActions: { display: "flex", gap: 10, marginTop: 16 },
  btnSave: {
    flex: 1,
    padding: 14,
    border: "none",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    background: "#10B981",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(16,185,129,0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnCancel: {
    padding: "14px 18px",
    border: "none",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    background: "#F1F5F9",
    color: "#64748B",
  },
  skeletonHero: {
    height: 220,
    background:
      "linear-gradient(90deg,#D1FAE5 25%,#A7F3D0 50%,#D1FAE5 75%)",
    backgroundSize: "300% 100%",
    animation: "shimmer 1.5s infinite",
  },
  skeletonCard: {
    height: 260,
    background:
      "linear-gradient(90deg,#F0FDF4 25%,#D1FAE5 50%,#F0FDF4 75%)",
    backgroundSize: "300% 100%",
    borderRadius: 20,
    animation: "shimmer 1.5s infinite",
  },
  errorBox: {
    background: "#fff",
    border: "1.5px solid #D1FAE5",
    borderRadius: 20,
    padding: 40,
    textAlign: "center",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function NurseProfile({ nurseId, onNavigate, onUpdateUser }) {
  const [nurse, setNurse]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg]           = useState(null);

  // دالة باش نجيبو الاسم من أي حقل متاح
  const getDisplayName = (nurseData) => {
    return nurseData?.fullName || 
           nurseData?.name || 
           nurseData?.userId || 
           nurseData?.gmail || 
           nurseData?._id || 
           "Nurse";
  };

  useEffect(() => {
    if (!nurseId) { setLoading(false); return; }
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/nurse/${nurseId}`)
      .then((r) => r.json())
      .then((data) => {
        const n = data.nurse || data;
        
        console.log("🔍 Full data from API:", n);
        console.log("📛 Fields available:", Object.keys(n));
        
        const displayName = getDisplayName(n);
        
        setNurse(n);
        setForm({
          fullName: displayName,
          userId:   n.userId   || "",
          gmail:    n.gmail    || "",
          diplome:  n.diplome  || "",
          service:  n.service  || "",
          equipe:   n.equipe   || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [nurseId]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/nurse/${nurseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setNurse({ ...nurse, ...form });
      setEditing(false);
      onUpdateUser?.(form);
      showMsg("success", "Profile updated ✅");
    } catch {
      showMsg("error", "Update failed ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this nurse profile?")) return;
    setDeleting(true);
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/nurse/${nurseId}`, { method: "DELETE" });
      onNavigate?.("home");
    } catch {
      showMsg("error", "Delete failed ❌");
      setDeleting(false);
    }
  };

  // ── Loading skeleton ──
  if (loading)
    return (
      <div style={S.page}>
        <div style={S.skeletonHero} />
        <div style={S.main}>
          <div style={S.skeletonCard} />
        </div>
      </div>
    );

  // ── Not found ──
  if (!nurse)
    return (
      <div style={S.page}>
        <div style={S.main}>
          <div style={S.errorBox}>
            <span style={{ fontSize: 36, display: "block", marginBottom: 10 }}>⚠️</span>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>Nurse not found</p>
            <button
              onClick={() => onNavigate?.("home")}
              style={{ background: "#10B981", color: "#fff", border: "none", borderRadius: 12, padding: "10px 22px", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );

  const displayName = getDisplayName(nurse);

  const fields = [
    { icon: "👤", label: "Full Name", val: displayName },
    { icon: "✉️", label: "Email",     val: nurse.gmail    || "Not specified" },
    { icon: "🎓", label: "Diploma",   val: nurse.diplome  || "Not specified" },
    { icon: "🏥", label: "Service",   val: nurse.service  || "Not specified" },
    { icon: "👥", label: "Team",      val: nurse.equipe   || "Not specified" },
  ];

  const editFields = [
    { key: "fullName", label: "Full Name", type: "text"  },
    { key: "userId",   label: "User ID",   type: "text"  },
    { key: "gmail",    label: "Email",     type: "email" },
    { key: "diplome",  label: "Diploma",   type: "text"  },
    { key: "service",  label: "Service",   type: "text"  },
    { key: "equipe",   label: "Team",      type: "text"  },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-100% 0} }
        @keyframes slideIn { from{opacity:0;transform:translate(-50%,-12px)} to{opacity:1;transform:translate(-50%,0)} }
        * { box-sizing: border-box; }
        input:focus { border-color: #10B981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important; background: #fff !important; }
      `}</style>

      {/* Toast */}
      {msg && <div style={S.toast(msg.type)}>{msg.text}</div>}

      {/* ── HERO ── */}
      <div style={S.hero}>
        <button style={S.backBtn} onClick={() => onNavigate?.("home")}>← Back</button>

        <div style={S.avatar}>👩‍⚕️</div>

        <h2 style={S.heroName}>{displayName}</h2>
        <span style={S.heroBadge}>{nurse.diplome || "Nurse"}</span>

        <div style={S.heroMeta}>
          <span style={S.dot} />
          Active · {nurse.service || "General"}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={S.main}>

        {!editing ? (
          <>
            {/* Info card */}
            <div style={S.infoCard}>
              {fields.map(({ icon, label, val }, i) => (
                <div
                  key={label}
                  style={{
                    ...S.infoRow,
                    borderBottom: i < fields.length - 1 ? "1px solid #F0FDF4" : "none",
                  }}
                >
                  <div style={S.iconWrap}>{icon}</div>
                  <div>
                    <div style={S.infoLabel}>{label}</div>
                    <div style={S.infoVal}>{val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons - Edit & Delete */}
            <div style={S.actions}>
              <button style={S.btnEdit} onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </button>
              <button
                style={{ ...S.btnDelete, opacity: deleting ? 0.6 : 1, cursor: deleting ? "not-allowed" : "pointer" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "⏳" : "🗑️"} {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </>
        ) : (
          /* Edit form */
          <div style={S.editCard}>
            <div style={S.editTitle}>✏️ Edit Nurse Info</div>

            {editFields.map(({ key, label, type }) => (
              <div key={key} style={S.formGroup}>
                <label style={S.formLabel}>{label}</label>
                <input
                  style={S.formInput}
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              </div>
            ))}

            <div style={S.editActions}>
              <button
                style={{ ...S.btnSave, opacity: saving ? 0.65 : 1, cursor: saving ? "not-allowed" : "pointer" }}
                onClick={handleUpdate}
                disabled={saving}
              >
                {saving ? "⏳ Saving…" : "💾 Save Changes"}
              </button>
              <button style={S.btnCancel} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}