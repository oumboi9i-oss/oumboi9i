// client/src/interfaces/Manager/ManagerMessage.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ManagerMessage.css';

const API = `${process.env.REACT_APP_API_URL}/api`;

const ROLE_EMOJI = { doctor: '👨‍⚕️', nurse: '👩‍⚕️', pharmacist: '💊', firefighter: '🚒' };
const ROLE_LABEL = { doctor: 'Doctor', nurse: 'Nurse', pharmacist: 'Pharmacist', firefighter: 'Firefighter' };

// Which backend collection to fetch for each manager role.
const ROLE_ENDPOINT = {
  doctor:      'doctor',
  nurse:       'nurse',
  pharmacist:  'pharmacist',
  firefighter: 'firefighter',
};

const getName = (u) => u.fullName || u.nomPharmacie || u.matricule || u.userId || 'User';

// The Message collection stores senderId/receiverId as display names
// (fullName / userId / matricule / nomPharmacie), not MongoDB _ids — same
// convention as Chatmessage.jsx used by doctor/nurse/pharmacist/firefighter.
const getMe = (u) =>
  u?.fullName ||
  u?.nomPharmacie ||
  u?.userId ||
  u?.matricule ||
  u?.displayName ||
  u?.email ||
  'manager';

export default function ManagerMessage({ currentUser, openUserId, openUserName }) {
  const [contacts, setContacts]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState('');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const bottomRef                   = useRef(null);

  const me = getMe(currentUser);

  // Role this manager is responsible for — comes from backend (req.user.managerType,
  // the actual field name on the Manager mongoose schema). Falls back to 'doctor'
  // only if it's ever missing, so the view never breaks.
  const managedRole = currentUser?.managerType || 'doctor';

  useEffect(() => {
    setLoading(true);
    const endpoint = ROLE_ENDPOINT[managedRole] || 'doctor';
    // Scoped to managedRole — a manager only ever loads contacts from their own role.
    axios.get(`${API}/${endpoint}/getAll`)
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        setContacts(list.map(u => ({ ...u, role: managedRole })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [managedRole]);

  // Auto-select a conversation when navigated here with a specific user
  // (e.g. from a notification's "Message X" button). Matches by id first,
  // falls back to matching by display name if only a name was provided.
  useEffect(() => {
    if (loading || (!openUserId && !openUserName)) return;
    let target = openUserId ? contacts.find(c => c._id === openUserId) : null;
    if (!target && openUserName) target = contacts.find(c => getName(c) === openUserName);
    if (target) {
      setSelected(target);
    } else if (openUserName) {
      // Contact not found in the loaded list (e.g. name mismatch) — still
      // let the manager start a conversation using the name we have.
      setSelected({ _id: `name-${openUserName}`, fullName: openUserName, role: managedRole });
    }
  }, [openUserId, openUserName, loading, contacts, managedRole]);

  useEffect(() => {
    if (!selected || !me) return;
    const partnerName = getName(selected);
    axios.get(`${API}/message/getAll`)
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        const filtered = all.filter(m =>
          (m.senderId === me && m.receiverId === partnerName) ||
          (m.receiverId === me && m.senderId === partnerName)
        );
        setMessages(filtered);
      })
      .catch(() => setMessages([]));
  }, [selected, me]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selected || sending) return;
    const partnerName = getName(selected);
    setSending(true);
    try {
      await axios.post(`${API}/message/add`, {
        senderId:   me,
        receiverId: partnerName,
        content:    text.trim(),
      });
      setText('');
      const r = await axios.get(`${API}/message/getAll`);
      const all = Array.isArray(r.data) ? r.data : [];
      const filtered = all.filter(m =>
        (m.senderId === me && m.receiverId === partnerName) ||
        (m.receiverId === me && m.senderId === partnerName)
      );
      setMessages(filtered);
    } catch {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filtered = contacts.filter(c =>
    !search || getName(c).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dm-shell">
      {/* Sidebar — contact list */}
      <div className="dm-sidebar">
        <div className="dm-sidebar-header">
          <h2 className="dm-sidebar-title">💬 Messages</h2>
          <p className="dm-sidebar-subtitle">
            {ROLE_EMOJI[managedRole]} {ROLE_LABEL[managedRole] || managedRole} staff only
          </p>
          <div className="dm-search">
            <span>🔍</span>
            <input
              placeholder="Search staff…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="dm-contact-list">
          {loading ? (
            [1,2,3,4,5].map(i => <div key={i} className="dm-skeleton" />)
          ) : filtered.length === 0 ? (
            <div className="dm-empty-list">No {ROLE_LABEL[managedRole] || managedRole} staff found</div>
          ) : filtered.map(c => (
            <div
              key={c._id}
              className={`dm-contact ${selected?._id === c._id ? 'dm-contact-active' : ''}`}
              onClick={() => setSelected(c)}
            >
              <div className="dm-avatar">{ROLE_EMOJI[c.role] || '👤'}</div>
              <div className="dm-contact-info">
                <span className="dm-contact-name">{getName(c)}</span>
                <span className="dm-contact-role">{c.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="dm-chat">
        {selected ? (
          <>
            <div className="dm-chat-header">
              <div className="dm-avatar">{ROLE_EMOJI[selected.role] || '👤'}</div>
              <div>
                <div className="dm-chat-name">{getName(selected)}</div>
                <div className="dm-chat-role">{selected.role}</div>
              </div>
            </div>

            <div className="dm-messages">
              {messages.length === 0 ? (
                <div className="dm-empty-chat">
                  <span>💬</span>
                  <p>No messages yet — say hello!</p>
                </div>
              ) : messages.map(m => {
                const isMine = m.senderId === me;
                return (
                  <div key={m._id} className={`dm-bubble-row ${isMine ? 'dm-out' : 'dm-in'}`}>
                    <div className={`dm-bubble ${isMine ? 'dm-bubble-out' : 'dm-bubble-in'}`}>
                      {m.content}
                      <span className="dm-bubble-time">
                        {new Date(m.timestamp || m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form className="dm-input-bar" onSubmit={handleSend}>
              <input
                className="dm-input"
                placeholder="Type a message…"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button type="submit" className="dm-send-btn" disabled={sending || !text.trim()}>
                {sending ? '⏳' : '📤'}
              </button>
            </form>
          </>
        ) : (
          <div className="dm-no-chat">
            <span>💬</span>
            <p>Select a staff member to start a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}