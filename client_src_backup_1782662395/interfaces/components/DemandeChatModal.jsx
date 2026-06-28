import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './DemandeChatModal.css';

const API = 'http://localhost:5000/api';

// ✅ Get display name - same as ChatMessage
const getMe = (u) =>
  u?.fullName ||
  u?.nomPharmacie ||
  u?.userId ||
  u?.matricule ||
  u?.displayName ||
  u?.email ||
  "user";

const DemandeChatModal = ({ demande, currentUser, onClose, onSendToDirector }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ✅ Use same logic as ChatMessage
  const me = getMe(currentUser);
  
  // ✅ Determine other party name
  const otherUserName = demande.proprietaireId === (currentUser._id || currentUser.id)
    ? demande.demandeurName
    : demande.gardeOwner;

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demande._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      // ✅ Fetch all messages and filter
      const res = await axios.get(`${API}/message/getAll`);
      const allMessages = res.data || [];
      
      // ✅ Filter messages between me and other user
      const filtered = allMessages.filter(m =>
        (m.senderId === me && m.receiverId === otherUserName) ||
        (m.receiverId === me && m.senderId === otherUserName)
      );
      
      setMessages(filtered);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      // ✅ Send message with correct IDs (names, not IDs)
      await axios.post(`${API}/message/add`, {
        senderId: me,
        receiverId: otherUserName,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      alert('❌ Erreur d\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (msg) => {
    return msg.senderId === me;
  };

  return (
    <div className="dcm-overlay" onClick={onClose}>
      <div className="dcm-modal" onClick={e => e.stopPropagation()}>
        
        <div className="dcm-header">
          <div className="dcm-header-info">
            <div className="dcm-avatar">👤</div>
            <div>
              <h3>💬 Conversation avec {otherUserName}</h3>
              <p>
                📅 {new Date(demande.gardeDate).toLocaleDateString()} · 
                {demande.type === 'vente' ? ' 💰 Vente' : ' 🔄 Échange'}
              </p>
            </div>
          </div>
          <button className="dcm-close" onClick={onClose}>✕</button>
        </div>

        <div className="dcm-messages">
          {messages.length === 0 ? (
            <div className="dcm-empty">
              <div className="dcm-empty-icon">💬</div>
              <h4>Démarrez la conversation</h4>
              <p>Discutez avec {otherUserName} pour vous mettre d'accord sur l'échange/vente</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg._id} 
                className={`dcm-message ${isMyMessage(msg) ? 'sent' : 'received'}`}
              >
                <div className="dcm-message-content">
                  {msg.content}
                </div>
                <span className="dcm-message-time">
                  {formatTime(msg.timestamp || msg.createdAt)}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="dcm-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="dcm-send-btn" disabled={loading || !newMessage.trim()}>
            {loading ? '⏳' : '📤'}
          </button>
        </form>

        <div className="dcm-footer">
          <p className="dcm-footer-hint">
            ⏳ En attente de la décision du manager
          </p>
        </div>

      </div>
    </div>
  );
};

export default DemandeChatModal;