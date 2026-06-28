// Chatmessage.jsx — Final complete version
import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import "./Chatmessage.css";

const SOCKET_URL = "http://localhost:5000";
const API        = "http://localhost:5000/api";

const ROLE_CONFIG = {
  doctor:      { heroEmoji: "🩺", emoji: "👨‍⚕️", color: "#2563eb", light: "#eff6ff" },
  nurse:       { heroEmoji: "💉", emoji: "👩‍⚕️", color: "#10b981", light: "#d1fae5" },
  firefighter: { heroEmoji: "🔥", emoji: "🚒",   color: "#ef4444", light: "#fee2e2" },
  pharmacist:  { heroEmoji: "💊", emoji: "💊",   color: "#059669", light: "#d1fae5" },
  manager:     { heroEmoji: "👔", emoji: "👔",   color: "#7c3aed", light: "#f5f3ff" },
};

// nameKey for each role's API
const ROLE_NAME_KEY = {
  doctor:      "fullName",
  nurse:       "userId",
  firefighter: "matricule",
  pharmacist:  "nomPharmacie",
  manager:     "fullName",
};

const EMOJI_LIST = ["😀","😂","🥰","😎","🤩","😴","🥺","😭","🙏","👍","❤️","🔥","✅","💯","👋","💪","🤝","🩺","💊","🩹","🏥","🚑","⚡","🌟","🎯"];
const randomBars = () => Array.from({ length: 20 }, () => Math.floor(Math.random() * 8) + 2);
const fmtTime = (d) => d
  ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

// Get display name from currentUser — works for all roles
const getMe = (u) =>
  u?.fullName ||       // doctor
  u?.nomPharmacie ||   // pharmacist
  u?.userId ||         // nurse
  u?.matricule ||      // firefighter
  u?.displayName ||
  u?.email ||
  "user";

// أضف هذا بعد const getMe = (u) => {...}
// Searches every staff collection (including managers) to find which role
// a given display name/email belongs to. Used to tag conversation partners
// with the right role so each inbox only shows same-role contacts.
//
// IMPORTANT: when the match is found in the "manager" collection, this does
// NOT return the literal string "manager" — it returns that manager's
// managerType (e.g. "doctor"), which is the actual field name in the
// Manager mongoose schema. A manager scoped to Doctor must show up as a
// "doctor" partner everywhere, otherwise their messages get filtered out of
// every other role's inbox (a doctor's inbox only keeps partners whose role
// === "doctor", so a partner tagged "manager" would silently disappear, even
// though the message was saved correctly in the database).
//
// NOTE: if a manager document has managerType: null (not yet assigned in
// the database), this falls back to "manager" — that manager simply won't
// match any role-scoped inbox until their managerType is set.
const getUserRole = async (userNameOrEmail) => {
  try {
    const roles = ["doctor", "nurse", "firefighter", "pharmacist", "manager"];
    for (const role of roles) {
      const res = await fetch(`${API}/${role}/getAll`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const found = data.find(p => 
          (p.fullName === userNameOrEmail) ||
          (p.userId === userNameOrEmail) ||
          (p.matricule === userNameOrEmail) ||
          (p.nomPharmacie === userNameOrEmail) ||
          (p.email === userNameOrEmail) ||
          (p.gmail === userNameOrEmail)
        );
        if (found) {
          if (role === "manager") {
            return found.managerType || "manager";
          }
          return role;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
};

// Notification beep
const playBeep = () => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch {}
};

/* ══════════════════════════════════════
   INCOMING CALL OVERLAY
══════════════════════════════════════ */
function IncomingCall({ call, onAccept, onReject, cfg }) {
  return (
    <div className="cm-call-overlay">
      <div className="cm-call-box">
        <div className="cm-call-avatar">{call.callType === "video" ? "📹" : "📞"}</div>
        <div className="cm-call-name">{call.callerName}</div>
        <div className="cm-call-label">{call.callType === "video" ? "Appel vidéo" : "Appel vocal"} entrant…</div>
        <div className="cm-call-actions">
          <button className="cm-call-btn reject" onClick={onReject}>📵</button>
          <button className="cm-call-btn accept" style={{ background: cfg.color }} onClick={onAccept}>📞</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   ACTIVE CALL OVERLAY
══════════════════════════════════════ */
function ActiveCall({ partner, callType, onEnd, cfg }) {
  const [sec, setSec] = useState(0);
  useEffect(() => { const t = setInterval(() => setSec(s => s + 1), 1000); return () => clearInterval(t); }, []);
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  return (
    <div className="cm-call-overlay">
      <div className="cm-call-box">
        <div className="cm-call-avatar">{callType === "video" ? "📹" : "📞"}</div>
        <div className="cm-call-name">{partner}</div>
        <div className="cm-call-label" style={{ color: "#22c55e" }}>En cours — {fmt(sec)}</div>
        <div className="cm-call-actions">
          <button className="cm-call-btn reject" onClick={onEnd}>📵 Terminer</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PROFILE MODAL
══════════════════════════════════════ */
function ProfileModal({ contact, cfg, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const APIS = Object.entries(ROLE_NAME_KEY).map(([role, nameKey]) => ({ role, nameKey }));
    Promise.all(
      APIS.map(a =>
        fetch(`${API}/${a.role}/getAll`)
          .then(r => r.json())
          .then(data => {
            if (!Array.isArray(data)) return null;
            const found = data.find(p =>
              (p[a.nameKey] || p.fullName || p.userId || p.matricule || p.nomPharmacie || "") === contact.name ||
              p.email === contact.email || p.gmail === contact.email
            );
            return found ? { ...found, _role: a.role } : null;
          })
          .catch(() => null)
      )
    ).then(results => { setProfile(results.find(r => r !== null) || null); setLoading(false); });
  }, [contact.name, contact.email]);

  const rc    = profile ? ROLE_CONFIG[profile._role] : null;
  const color = rc?.color || cfg.color;
  const light = rc?.light || cfg.light;
  const emoji = rc?.emoji || contact.avatar || "👤";

  return (
    <div className="cm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cm-modal cm-profile-modal">
        <button className="cm-modal-close cm-profile-close" onClick={onClose}>✕</button>
        <div className="cm-profile-header" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
          <div className="cm-profile-av" style={{ background: light }}>{emoji}</div>
          <h2 className="cm-profile-name">{contact.name}</h2>
          {profile?._role && <span className="cm-profile-role-badge">{profile._role}</span>}
        </div>
        {loading ? (
          <div style={{ padding: 20 }}>{[1,2,3].map(i => <div key={i} className="cm-modal-skeleton" style={{ marginBottom: 10 }} />)}</div>
        ) : profile ? (
          <div className="cm-profile-body">
            {[
              { icon:"📧", label:"Email",          value: profile.email || profile.gmail },
              { icon:"🩺", label:"Spécialité",     value: profile.specialty },
              { icon:"👤", label:"Identifiant",    value: profile.userId },
              { icon:"🎖️", label:"Grade",          value: profile.grade },
              { icon:"🚒", label:"Unité",          value: profile.uniteIntervention },
              { icon:"🏥", label:"Service",        value: profile.service },
              { icon:"👥", label:"Équipe",         value: profile.equipe },
              { icon:"💊", label:"Pharmacie",      value: profile.nomPharmacie },
              { icon:"📍", label:"Adresse",        value: profile.adressePharmacie || profile.location },
              { icon:"🪪", label:"N° Ordre",       value: profile.numOrdre },
              { icon: profile.isAvailable ? "🟢":"🔴",
                label:"Disponibilité",
                value: profile.isAvailable != null ? (profile.isAvailable ? "Disponible" : "Non disponible") : null,
                color: profile.isAvailable ? "#22c55e" : "#ef4444" },
            ].filter(r => r.value).map((r, i) => (
              <div key={i} className="cm-profile-row">
                <span className="cm-profile-icon">{r.icon}</span>
                <div>
                  <div className="cm-profile-label">{r.label}</div>
                  <div className="cm-profile-value" style={r.color ? { color: r.color } : {}}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 32, textAlign:"center", color:"#94a3b8" }}>
            <div style={{ fontSize:40 }}>👤</div><p>Profil non disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   VOICE BUBBLE
══════════════════════════════════════ */
function VoiceBubble({ msg }) {
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);
  const toggle = () => {
    if (playing) { clearTimeout(timerRef.current); setPlaying(false); return; }
    setPlaying(true);
    const [m, s] = (msg.dur || "0:10").split(":").map(Number);
    timerRef.current = setTimeout(() => setPlaying(false), (m * 60 + s) * 1000);
  };
  return (
    <div className="cm-voice">
      <button className="cm-voice-btn" onClick={toggle}>{playing ? "⏸" : "▶"}</button>
      <div className="cm-waveform">
        {(msg.bars || randomBars()).map((h, i) => (
          <div key={i} className="cm-bar" style={{ height:`${h*2.2}px`, opacity: playing && i < 10 ? 1 : 0.45 }} />
        ))}
      </div>
      <span className="cm-voice-dur">{msg.dur || "0:00"}</span>
    </div>
  );
}

/* ══════════════════════════════════════
   BUBBLE
══════════════════════════════════════ */
function Bubble({ msg, onImg, onAvatarClick }) {
  const dir = msg.dir === "out" ? "out" : "in";
  const emojiOnly = msg.type === "text" &&
    /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u.test(msg.text?.trim());
  return (
    <div className={`cm-row ${dir}`}>
      {dir === "in" && (
        <div className="cm-avatar-sm" style={{ cursor:"pointer" }}
          onClick={() => onAvatarClick?.({ name: msg.sender, avatar: msg.avatar || "👤" })}>
          {msg.avatar || "👤"}
        </div>
      )}
      <div className="cm-wrap">
        {dir === "in" && (
          <div className="cm-sender" style={{ cursor:"pointer" }}
            onClick={() => onAvatarClick?.({ name: msg.sender, avatar: msg.avatar || "👤" })}>
            {msg.sender}
          </div>
        )}
        {msg.type === "image" && (
          <div className="cm-bubble cm-img-bubble" onClick={() => msg.url && onImg(msg.url)}>
            <img src={msg.url} alt="photo" onError={e => e.target.style.display="none"} />
            <div className="cm-meta"><span>{msg.time}</span></div>
          </div>
        )}
        {msg.type === "video" && (
          <div className={`cm-bubble ${dir}`} style={{ padding:6 }}>
            <video src={msg.url} controls style={{ width:"100%", borderRadius:10, maxHeight:200 }} />
            <div className="cm-meta"><span>{msg.time}</span></div>
          </div>
        )}
        {msg.type === "voice" && (
          <div className={`cm-bubble ${dir}`}>
            <VoiceBubble msg={msg} />
            <div className="cm-meta">
              <span>{msg.time}</span>
              {dir === "out" && <span>{msg.status}</span>}
            </div>
          </div>
        )}
        {msg.type === "text" && (
          <div className={`cm-bubble ${dir} ${emojiOnly ? "emoji-only" : ""}`}>
            {msg.text}
            {!emojiOnly && (
              <div className="cm-meta">
                <span>{msg.time}</span>
                {dir === "out" && <span>{msg.status}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   CHAT WINDOW
══════════════════════════════════════ */
function ChatWindow({ conv, cfg, onBack, currentUser, socket }) {
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState("");
  const [sending, setSending]     = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime]     = useState(0);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [lightbox, setLightbox]   = useState(null);
  const [toast, setToast]         = useState(null);
  const [profileContact, setProfileContact] = useState(null);
  const [partnerTyping, setPartnerTyping]   = useState(false);
  const [callState, setCallState] = useState(null);
  const [callType, setCallType]   = useState("voice");
  const [incomingCall, setIncomingCall] = useState(null);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const imgInputRef = useRef(null);
  const vidInputRef = useRef(null);
  const recTimerRef = useRef(null);
  const typingTimer = useRef(null);

  const me = getMe(currentUser);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load messages from API ──
  const loadMessages = useCallback(() => {
    fetch(`${API}/message/getAll`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setLoading(false); return; }
        const filtered = data
          .filter(m =>
            (m.senderId === me && m.receiverId === conv.name) ||
            (m.receiverId === me && m.senderId === conv.name)
          )
          .map(m => ({
            id:     m._id,
            type:   "text",
            sender: m.senderId,
            text:   m.content,
            time:   fmtTime(m.timestamp || m.createdAt),
            dir:    m.senderId === me ? "out" : "in",
            status: "✓✓",
            avatar: conv.avatar,
          }));
        setMessages(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [conv.name, me, conv.avatar]);

  useEffect(() => { setLoading(true); setMessages([]); loadMessages(); }, [conv.id, loadMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, partnerTyping]);

  // ── Socket listeners ──
  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      if (msg.senderId === conv.name) {
        setMessages(prev => [...prev, {
          id: msg._id || `s-${Date.now()}`, type:"text",
          sender: msg.senderId, text: msg.content,
          time: fmtTime(msg.timestamp), dir:"in",
          status:"", avatar: conv.avatar,
        }]);
        playBeep();
      }
    };
    const onTyping    = ({ from }) => { if (from === conv.name) setPartnerTyping(true); };
    const onStopTyp   = () => setPartnerTyping(false);
    const onIncoming  = (call) => setIncomingCall(call);
    const onAccepted  = () => { setCallState("active"); };
    const onRejected  = () => { setCallState(null); showToast("📵 Appel refusé"); };
    const onEnded     = () => { setCallState(null); setIncomingCall(null); showToast("📵 Appel terminé"); };

    socket.on("newMessage",   onMsg);
    socket.on("typing",       onTyping);
    socket.on("stopTyping",   onStopTyp);
    socket.on("incomingCall", onIncoming);
    socket.on("callAccepted", onAccepted);
    socket.on("callRejected", onRejected);
    socket.on("callEnded",    onEnded);
    return () => {
      socket.off("newMessage", onMsg);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyp);
      socket.off("incomingCall", onIncoming);
      socket.off("callAccepted", onAccepted);
      socket.off("callRejected", onRejected);
      socket.off("callEnded", onEnded);
    };
  }, [socket, conv.name, conv.avatar]);

  // ── Recording timer ──
  useEffect(() => {
    if (recording) { recTimerRef.current = setInterval(() => setRecTime(t => t + 1), 1000); }
    else { clearInterval(recTimerRef.current); setRecTime(0); }
    return () => clearInterval(recTimerRef.current);
  }, [recording]);

  const fmtRec = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  // ── Send text ──
  const sendMsg = async () => {
    const content = text.trim();
    if (!content && !mediaPreview) return;

    const tempId = `local-${Date.now()}`;
    const newMsg = {
      id: tempId, type: mediaPreview ? mediaPreview.type : "text",
      sender: me, text: content || (mediaPreview?.name ?? ""),
      url: mediaPreview?.url || null,
      time: fmtTime(), dir:"out", status:"✓", avatar:"👤",
    };
    setMessages(prev => [...prev, newMsg]);
    setText(""); setMediaPreview(null); setShowEmoji(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (socket) socket.emit("stopTyping", { to: conv.name });

    setSending(true);
    try {
      const res = await fetch(`${API}/message/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: me, receiverId: conv.name, content: content || "[media]" }),
      });
      const saved = await res.json();
      const savedId = saved._id || saved.message?.id || tempId;
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, id: savedId, status:"✓✓" } : m
      ));
      if (socket) {
        socket.emit("sendMessage", {
          senderId: me, receiverId: conv.name,
          content: content || "[media]",
          timestamp: new Date(), _id: savedId,
        });
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status:"✓" } : m));
    } finally { setSending(false); }
  };

  // ── Send voice ──
  const sendVoice = () => {
    setRecording(false);
    setMessages(prev => [...prev, {
      id: `v-${Date.now()}`, type:"voice", sender: me,
      dur: fmtRec(recTime), bars: randomBars(),
      time: fmtTime(), dir:"out", status:"✓",
    }]);
    showToast("🎤 Message vocal envoyé");
  };

  // ── File attach ──
  const handleFile = (e, type) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    setMessages(prev => [...prev, {
      id: `f-${Date.now()}`, type, sender: me, url,
      text: file.name, time: fmtTime(), dir:"out", status:"✓", avatar:"👤",
    }]);
    e.target.value = "";
  };

  // ── Typing ──
  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight,120)}px`; }
    if (socket) {
      socket.emit("typing", { to: conv.name, from: me });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socket.emit("stopTyping", { to: conv.name }), 1500);
    }
  };

  // ── Calls ──
  const startCall = (type) => {
    if (!socket) { showToast("⚠️ Socket non connecté", "error"); return; }
    setCallType(type); setCallState("calling");
    socket.emit("callUser", { to: conv.name, from: me, callerName: me, callType: type });
  };
  const acceptCall = () => {
    setCallState("active"); setCallType(incomingCall.callType);
    socket?.emit("acceptCall", { to: incomingCall.from });
    setIncomingCall(null);
  };
  const rejectCall = () => {
    socket?.emit("rejectCall", { to: incomingCall.from });
    setIncomingCall(null);
  };
  const endCall = () => {
    socket?.emit("endCall", { to: conv.name });
    setCallState(null);
  };

  return (
    <div className="cm-window">
      {toast && <div className={`cm-toast ${toast.type}`}>{toast.msg}</div>}
      {incomingCall && !callState && (
        <IncomingCall call={incomingCall} cfg={cfg} onAccept={acceptCall} onReject={rejectCall} />
      )}
      {callState && (
        <ActiveCall partner={conv.name} callType={callType} onEnd={endCall} cfg={cfg} />
      )}

      {/* Topbar */}
      <div className="cm-topbar">
        <button className="cm-back-btn" onClick={onBack}>←</button>
        <div className="cm-topbar-av" style={{ cursor:"pointer" }}
          onClick={() => setProfileContact({ name: conv.name, avatar: conv.avatar })}>
          {conv.avatar}<span className="cm-online-dot" />
        </div>
        <div className="cm-topbar-info" style={{ cursor:"pointer" }}
          onClick={() => setProfileContact({ name: conv.name, avatar: conv.avatar })}>
          <div className="cm-topbar-name">{conv.name}</div>
          <div className="cm-topbar-status" style={{ color:"#22c55e" }}>
            {partnerTyping ? "en train d'écrire..." : "Voir le profil ›"}
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button className="cm-icon-btn" style={{ color: cfg.color }} onClick={() => startCall("voice")}>📞</button>
          <button className="cm-icon-btn" style={{ color: cfg.color }} onClick={() => startCall("video")}>📹</button>
        </div>
      </div>

      {/* Messages */}
      <div className="cm-messages">
        <div className="cm-date-sep"><span>Aujourd'hui</span></div>
        {loading
          ? [1,2,3].map(i => <div key={i} className={`cm-skeleton ${i%2?"sk-out":"sk-in"}`} />)
          : messages.length === 0
          ? <div className="cm-no-msg">💬 Commencez la conversation avec <b>{conv.name}</b></div>
          : messages.map(m => <Bubble key={m.id} msg={m} onImg={setLightbox} onAvatarClick={setProfileContact} />)
        }
        {partnerTyping && (
          <div className="cm-row in">
            <div className="cm-avatar-sm">{conv.avatar}</div>
            <div className="cm-wrap">
              <div className="cm-bubble in cm-typing">
                <div className="cm-dots"><div className="cm-dot"/><div className="cm-dot"/><div className="cm-dot"/></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div className="cm-media-prev">
          {mediaPreview.type === "image"
            ? <img src={mediaPreview.url} alt="prev" className="cm-prev-thumb" />
            : <span style={{ fontSize:32 }}>🎥</span>
          }
          <div style={{ flex:1, fontSize:13, color:"#64748b" }}>
            <div style={{ fontWeight:600 }}>{mediaPreview.name}</div>
            <div>{mediaPreview.size}</div>
          </div>
          <button className="cm-prev-rm" onClick={() => setMediaPreview(null)}>✕</button>
        </div>
      )}

      {/* Input */}
      {recording ? (
        <div className="cm-rec-bar">
          <div className="cm-rec-dot" />
          <span className="cm-rec-time">🎤 {fmtRec(recTime)}</span>
          <button className="cm-rec-cancel" onClick={() => setRecording(false)}>Annuler</button>
          <button className="cm-rec-send" style={{ background: cfg.color }} onClick={sendVoice}>Envoyer</button>
        </div>
      ) : (
        <div className="cm-input-bar">
          <input ref={imgInputRef} type="file" accept="image/*"  style={{ display:"none" }} onChange={e => handleFile(e,"image")} />
          <input ref={vidInputRef} type="file" accept="video/*" style={{ display:"none" }} onChange={e => handleFile(e,"video")} />
          <button className="cm-attach-btn" style={{ color: cfg.color }} onClick={() => imgInputRef.current?.click()}>📷</button>
          <button className="cm-attach-btn" style={{ color: cfg.color }} onClick={() => vidInputRef.current?.click()}>🎥</button>
          <div className="cm-input-wrap">
            <button className="cm-emoji-toggle" onClick={() => setShowEmoji(s => !s)}>😊</button>
            <textarea ref={textareaRef} rows={1} placeholder="Message..."
              value={text} onChange={handleTextChange}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }} />
          </div>
          {text.trim() || mediaPreview
            ? <button className="cm-send-btn" style={{ background: cfg.color }} onClick={sendMsg} disabled={sending}>➤</button>
            : <button className="cm-send-btn" style={{ background: cfg.color }} onClick={() => setRecording(true)}>🎤</button>
          }
          {showEmoji && (
            <div className="cm-emoji-picker">
              {EMOJI_LIST.map(e => (
                <button key={e} className="cm-emoji-item"
                  onClick={() => { setText(t => t + e); setShowEmoji(false); }}>{e}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {lightbox && (
        <div className="cm-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="full" />
          <button className="cm-lb-close" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
      {profileContact && (
        <ProfileModal contact={profileContact} cfg={cfg} onClose={() => setProfileContact(null)} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   CONTACTS MODAL
══════════════════════════════════════ */
function ContactsModal({ cfg, role, onClose, onCreate }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    // Only fetch the roles relevant to figuring out same-role contacts:
    // the current user's own role collection, plus managers (who need their
    // managerType checked individually, since "manager" itself isn't a role
    // anyone messages as — they're scoped to whichever role they manage).
    Promise.all([
      fetch(`${API}/${role}/getAll`)
        .then(r => r.json())
        .then(data => (Array.isArray(data) ? data : []).map(p => ({
          id:     p._id,
          name:   p[ROLE_NAME_KEY[role]] || p.fullName || p.userId || p.matricule || p.nomPharmacie || "?",
          role,
          email:  p.email || p.gmail || "",
          avatar: ROLE_CONFIG[role]?.emoji || "👤",
        })))
        .catch(() => []),
      fetch(`${API}/manager/getAll`)
        .then(r => r.json())
        .then(data => (Array.isArray(data) ? data : [])
          .filter(p => p.managerType === role)
          .map(p => ({
            id:     p._id,
            name:   p.fullName || p.userId || "?",
            role,
            email:  p.email || p.gmail || "",
            avatar: ROLE_CONFIG.manager?.emoji || "👔",
          })))
        .catch(() => []),
    ]).then(([sameRole, managers]) => {
      setContacts([...sameRole, ...managers]);
      setLoading(false);
    });
  }, [role]);

  const filtered = contacts.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="cm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cm-modal">
        <div className="cm-modal-header">
          <h3>👥 Nouveau message</h3>
          <button className="cm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cm-modal-search">
          <span>🔍</span>
          <input placeholder="Rechercher un contact…" value={search}
            onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        <div className="cm-modal-list">
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="cm-modal-skeleton" />)
            : filtered.length === 0
            ? <div className="cm-modal-empty">Aucun contact trouvé</div>
            : filtered.map(c => (
              <div key={c.id} className="cm-modal-item" onClick={() => { onCreate(c); onClose(); }}>
                <div className="cm-modal-av" style={{ background: ROLE_CONFIG[c.role]?.light || "#eff6ff" }}>
                  {c.avatar}
                </div>
                <div className="cm-modal-info">
                  <div className="cm-modal-name">{c.name}</div>
                  <div className="cm-modal-role">{c.role}{c.email ? ` · ${c.email}` : ""}</div>
                </div>
                <span style={{ color: cfg.color, fontSize:20 }}>›</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   NOTIFICATION BANNER
══════════════════════════════════════ */
function NotifBanner({ notif, color, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="cm-notif-banner" style={{ borderLeft:`4px solid ${color}` }}>
      <span className="cm-notif-icon">💬</span>
      <div className="cm-notif-body">
        <div className="cm-notif-from">{notif.from}</div>
        <div className="cm-notif-text">{notif.text}</div>
      </div>
      <button className="cm-notif-close" onClick={onClose}>✕</button>
    </div>
  );
}

/* ══════════════════════════════════════
   INBOX
══════════════════════════════════════ */
function Inbox({ cfg, role, onSelect, onNavigate, currentUser, socket, notifications, clearNotifs, openUserName }) {
  const [convs, setConvs]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [tab, setTab]             = useState("Tout");
  const [showModal, setShowModal] = useState(false);

  const me = getMe(currentUser);

  const loadConvs = useCallback(() => {
  fetch(`${API}/message/getAll`)
    .then(r => r.json())
    .then(async data => {
      if (!Array.isArray(data)) { setLoading(false); return; }
      const map = {};
      for (const m of data) {
        const partner = m.senderId === me ? m.receiverId : m.senderId;
        if (!partner) continue;
        
        // جلب دور المستخدم الآخر (يرجع managedRole إذا كان manager، ماشي "manager" مباشرة)
        const partnerRole = await getUserRole(partner);
        // فقط إذا كان نفس الدور
        if (partnerRole !== role) continue;
        
        const t = new Date(m.timestamp || m.createdAt || 0);
        if (!map[partner] || t > new Date(map[partner]._t || 0)) {
          map[partner] = { name: partner, lastMsg: m.content, _t: m.timestamp || m.createdAt, unread: 0, role: partnerRole };
        }
        if (m.senderId !== me) map[partner].unread = (map[partner].unread || 0) + 1;
      }
      setConvs(Object.values(map).map((c, i) => ({
        id: `conv-${i}`, name: c.name, avatar: ROLE_CONFIG[c.role]?.emoji || "👤",
        lastMsg: c.lastMsg, time: fmtTime(c._t),
        unread: c.unread, online: true,
      })));
      setLoading(false);
    })
    .catch(() => setLoading(false));
}, [me, role]);
        
  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    if (!openUserName || loading) return;
    const existing = convs.find(c => c.name === openUserName);
    if (existing) {
      handleSelect(existing);
    } else {
      const newConv = {
        id:      `open-${Date.now()}`,
        name:    openUserName,
        avatar:  '👤',
        lastMsg: '',
        time:    'maintenant',
        unread:  0,
        online:  true,
      };
      setConvs(prev => [newConv, ...prev]);
      handleSelect(newConv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUserName, loading]);

  // Socket: update inbox in real-time
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      setConvs(prev => {
        const exists = prev.find(c => c.name === msg.senderId);
        if (exists) {
          return prev.map(c => c.name === msg.senderId
            ? { ...c, lastMsg: msg.content, time: fmtTime(msg.timestamp), unread: (c.unread||0)+1 }
            : c
          );
        }
        return [{ id:`conv-${Date.now()}`, name: msg.senderId, avatar:"👤",
          lastMsg: msg.content, time: fmtTime(msg.timestamp), unread:1, online:true }, ...prev];
      });
    };
    socket.on("newMessage", handler);
    return () => socket.off("newMessage", handler);
  }, [socket]);

  const filtered = convs.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const tabFiltered = filtered.filter(c =>
    tab === "Tout" ? true : tab === "Groupes" ? c.isGroup : !c.isGroup
  );

  const handleSelect = (c) => { clearNotifs(c.name); onSelect(c); };

  const createConv = async (contact) => {
  // ✅ التحقق من أن المراسل من نفس الدور (managedRole إذا كان manager)
  const contactRole = await getUserRole(contact.name);
  if (contactRole !== role) {
    alert(`❌ Vous ne pouvez pas envoyer de message à un ${contactRole}.`);
    return;
  }
  const exists = convs.find(c => c.name === contact.name);
  if (exists) { handleSelect(exists); return; }
  const newConv = { id:`new-${Date.now()}`, name: contact.name, avatar: contact.avatar,
    lastMsg:"", time:"maintenant", unread:0, online:true };
  setConvs(prev => [newConv, ...prev]);
  handleSelect(newConv);
};

  const totalUnread = Object.values(notifications).reduce((a,b) => a+b, 0);

  return (
    <div className="cm-inbox">
      <div className="cm-inbox-header">
        <div style={{ marginBottom:12 }}>
          <h2 className="cm-inbox-title">
            {cfg.heroEmoji} Messages
            {totalUnread > 0 && <span className="cm-inbox-badge" style={{ background: cfg.color }}>{totalUnread}</span>}
          </h2>
        </div>
        <div className="cm-search-box">
          <span>🔍</span>
          <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="cm-tabs">
        {["Tout","Groupes","Privé"].map(t => (
          <button key={t} className={`cm-tab ${tab===t?"active":""}`}
            style={tab===t ? { color: cfg.color, borderBottomColor: cfg.color } : {}}
            onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="cm-conv-list">
        {loading
          ? [1,2,3].map(i => <div key={i} className="cm-conv-skeleton" />)
          : tabFiltered.length === 0
          ? <div className="cm-inbox-empty"><span>💬</span><p>Aucune conversation</p><p style={{fontSize:13}}>Appuyez sur ✏️ pour démarrer</p></div>
          : tabFiltered.map(c => (
            <div key={c.id} className={`cm-conv-item ${c.unread>0?"cm-conv-unread":""}`}
              onClick={() => handleSelect(c)}>
              <div className="cm-conv-av">
                {c.avatar}
                {c.online && <span className="cm-conv-dot" />}
              </div>
              <div className="cm-conv-body">
                <div className="cm-conv-row1">
                  <span className="cm-conv-name" style={c.unread>0?{fontWeight:800}:{}}>{c.name}</span>
                  <span className="cm-conv-time">{c.time}</span>
                </div>
                <span className="cm-conv-preview" style={c.unread>0?{fontWeight:700,color:"#374151"}:{}}>
                  {c.lastMsg || "Démarrer une conversation…"}
                </span>
              </div>
              {c.unread > 0 && <div className="cm-badge" style={{ background: cfg.color }}>{c.unread}</div>}
            </div>
          ))
        }
      </div>

      <button className="cm-fab" style={{ background: cfg.color }} onClick={() => setShowModal(true)}>✏️</button>
      {showModal && <ContactsModal cfg={cfg} role={role} onClose={() => setShowModal(false)} onCreate={createConv} />}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════ */
export default function ChatMessage({ role = "doctor", onNavigate, currentUser, openUserName }) {
  const [activeConv, setActiveConv] = useState(null);
  const [socket, setSocket]         = useState(null);
  const [notifications, setNotifications] = useState({});
  const [banner, setBanner]         = useState(null);

  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.doctor;
  const me  = getMe(currentUser);

  // ── Init socket ──
  useEffect(() => {
    if (!me || me === "user") return;
    const s = io(SOCKET_URL, { transports:["websocket"], reconnectionAttempts: 5 });
    s.on("connect",    () => s.emit("register", me));
    s.on("newMessage", (msg) => {
      if (activeConv?.name !== msg.senderId) {
        setNotifications(prev => ({ ...prev, [msg.senderId]: (prev[msg.senderId]||0)+1 }));
        setBanner({ from: msg.senderId, text: msg.content });
        playBeep();
      }
    });
    setSocket(s);
    return () => s.disconnect();
  }, [me]);

  const clearNotifs = (name) =>
    setNotifications(prev => { const n = {...prev}; delete n[name]; return n; });

  return (
    <div className={`cm-page role-${role}`} style={{ "--accent": cfg.color, "--accent-light": cfg.light }}>
      {banner && !activeConv && (
        <NotifBanner notif={banner} color={cfg.color} onClose={() => setBanner(null)} />
      )}
      {activeConv ? (
        <ChatWindow conv={activeConv} cfg={cfg}
          onBack={() => setActiveConv(null)}
          currentUser={currentUser} socket={socket} />
      ) : (
        <Inbox cfg={cfg} role={role} onSelect={setActiveConv}
          onNavigate={onNavigate} currentUser={currentUser}
          socket={socket} notifications={notifications} clearNotifs={clearNotifs}
          openUserName={openUserName} />
      )}
    </div>
  );
}

export const DoctorMessage      = (p) => <ChatMessage {...p} role="doctor" />;
export const NurseMessage       = (p) => <ChatMessage {...p} role="nurse" />;
export const FirefighterMessage = (p) => <ChatMessage {...p} role="firefighter" />;
export const PharmacistMessage  = (p) => <ChatMessage {...p} role="pharmacist" />;