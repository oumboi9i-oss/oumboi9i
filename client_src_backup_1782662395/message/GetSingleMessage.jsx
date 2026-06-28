// 📁 src/message/GetSingleMessage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GetSingleMessage.css';
import '../styles/form.css';

const API_BASE = 'http://localhost:5000/api';

const GetSingleMessage = ({ messageId }) => {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 Received messageId:', messageId);
    
    if (!messageId) {
      console.log('⚠️ No message ID provided');
      setMessage(null);
      return;
    }

    const fetchMessage = async () => {
      try {
        console.log('📡 Fetching message:', `${API_BASE}/message/${messageId}`);
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_BASE}/message/${messageId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('✅ Response:', response.data);
        
        setMessage(response.data.message);
      } catch (err) {
        console.error('❌ Error:', err);
        
        // Fallback: بحث بديل
        if (err.response?.status === 400 || err.response?.status === 404) {
          console.log('🔄 Trying fallback search...');
          try {
            const res = await axios.get(`${API_BASE}/message/getAll`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const found = res.data.find(m => m._id === messageId || m.id === messageId);
            if (found) {
              setMessage(found);
              setError(null);
              return;
            }
          } catch (fbErr) {
            console.error('❌ Fallback failed:', fbErr);
          }
        }
        
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, [messageId]);

  // حالة: ماكاينش ID
  if (!messageId) {
    return (
      <div className="message-detail-page">
        <div className="message-card">
          <p style={{textAlign:'center',color:'#64748b',padding:'40px'}}>
            💬 اضغط على رسالة لعرض تفاصيلها
          </p>
        </div>
      </div>
    );
  }

  // حالة: جاري التحميل
  if (loading) {
    return (
      <div className="message-detail-page">
        <div className="message-card">
          <div className="loading-spinner"><p>⏳ جاري التحميل...</p></div>
        </div>
      </div>
    );
  }

  // حالة: خطأ
  if (error) {
    return (
      <div className="message-detail-page">
        <div className="message-card">
          <div className="error-message"><p>❌ {error}</p></div>
          <button className="main-btn" onClick={() => window.location.reload()} style={{marginTop:'20px'}}>🔄 إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  // حالة: ما لقيناش الرسالة
  if (!message) {
    return (
      <div className="message-detail-page">
        <div className="message-card">
          <p style={{textAlign:'center',padding:'40px'}}>⚠️ لم يتم العثور على الرسالة</p>
        </div>
      </div>
    );
  }

  // ✅ عرض البيانات بنجاح
  return (
    <div className="message-detail-page">
      <div className="message-card">
        {/* Header */}
        <div className="message-header">
          <div className="message-icon">💬</div>
          <h2 className="message-title">رسالة #{message.id?.slice(-6) || 'N/A'}</h2>
          <p className="message-preview">
            "{message.content?.slice(0, 50)}{message.content?.length > 50 ? '...' : ''}"
          </p>
        </div>

        {/* Info Rows */}
        <div className="message-info">
          <div className="info-row">
            <span className="info-label">👤 المرسل</span>
            <span className="info-value"><span className="user-id">{message.senderId?.slice(-8) || 'N/A'}</span></span>
          </div>
          
          <div className="info-row">
            <span className="info-label">🎯 المستقبل</span>
            <span className="info-value"><span className="user-id">{message.receiverId?.slice(-8) || 'N/A'}</span></span>
          </div>
          
          <div className="info-row">
            <span className="info-label">✅ الحالة</span>
            <span className="info-value">
              <span className={`status-badge ${message.isRead ? 'read' : 'unread'}`}>
                {message.isRead ? '👁️ مقروءة' : '📬 غير مقروءة'}
              </span>
            </span>
          </div>
          
          <div className="info-row">
            <span className="info-label">📅 الوقت</span>
            <span className="info-value">
              {message.timestamp ? new Date(message.timestamp).toLocaleString('ar-MA') : 'N/A'}
            </span>
          </div>
        </div>

        {/* Message Content */}
        {message.content && (
          <>
            <div className="info-row" style={{borderBottom:'1px solid #f1f5f9',paddingBottom:'10px'}}>
              <span className="info-label">📝 المحتوى</span>
            </div>
            <div className="message-content">{message.content}</div>
          </>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="action-btn secondary" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>⬆️ للأعلى</button>
          <button className="action-btn primary" onClick={() => window.location.reload()}>🔄 تحديث</button>
        </div>
      </div>
    </div>
  );
};

export default GetSingleMessage;