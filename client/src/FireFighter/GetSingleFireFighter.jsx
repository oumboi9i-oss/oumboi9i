import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GetSingleFireFighter.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const GetSingleFireFighter = ({ fireFighterId }) => {
  const [fireFighter, setFireFighter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 Received fireFighterId:', fireFighterId);
    
    if (!fireFighterId) { setFireFighter(null); return; }

    const fetchFireFighter = async () => {
      try {
        console.log('📡 Fetching:', `${API_BASE}/FireFighter/${fireFighterId}`);
        setLoading(true); setError(null);
        
        const response = await axios.get(`${API_BASE}/FireFighter/${fireFighterId}`);
        console.log('✅ Response:', response.data);
        setFireFighter(response.data.fireFighter);
        
      } catch (err) {
        console.error('❌ Error:', err);
        if (err.response?.status === 400 || err.response?.status === 404) {
          console.log('🔄 Trying fallback...');
          try {
            const res = await axios.get(`${API_BASE}/FireFighter/getAll`);
            const found = res.data.find(f => f._id === fireFighterId || f.matricule === fireFighterId);
            if (found) { setFireFighter(found); setError(null); return; }
          } catch (fbErr) { console.error('❌ Fallback failed:', fbErr); }
        }
        setError(err.response?.data?.message || err.message);
      } finally { setLoading(false); }
    };

    fetchFireFighter();
  }, [fireFighterId]);

  if (!fireFighterId) {
    return (
      <div className="firefighter-detail-page">
        <div className="firefighter-card">
          <p style={{textAlign:'center',color:'#64748b',padding:'40px'}}>
            👨‍🚒 اضغط على عنصر إطفاء لعرض تفاصيله
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="firefighter-detail-page">
        <div className="firefighter-card">
          <div className="loading-spinner"><p>⏳ جاري التحميل...</p></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="firefighter-detail-page">
        <div className="firefighter-card">
          <div className="error-message"><p>❌ {error}</p></div>
          <button className="main-btn" onClick={() => window.location.reload()} style={{marginTop:'20px'}}>🔄 إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  if (!fireFighter) {
    return (
      <div className="firefighter-detail-page">
        <div className="firefighter-card">
          <p style={{textAlign:'center',padding:'40px'}}>⚠️ لم يتم العثور على عنصر الإطفاء</p>
        </div>
      </div>
    );
  }

  return (
    <div className="firefighter-detail-page">
      <div className="firefighter-card">
        <div className="firefighter-header">
          <div className="firefighter-avatar">🚒</div>
          <h2 className="firefighter-name">عنصر إطفاء #{fireFighter.matricule}</h2>
          <p className="firefighter-grade">
            <span className="badge grade">🎖️ {fireFighter.grade || 'غير محدد'}</span>
          </p>
        </div>

        <div className="firefighter-info">
          <div className="info-row"><span className="info-label">🆔 المعرف</span><span className="info-value" style={{fontSize:'11px'}}>{fireFighter.id?.slice(-8) || 'N/A'}</span></div>
          <div className="info-row"><span className="info-label">👤 User ID</span><span className="info-value" style={{fontSize:'11px'}}>{fireFighter.userId?.slice(-8) || 'غير مرتبط'}</span></div>
          <div className="info-row"><span className="info-label">🔢 الرقم العسكري</span><span className="info-value">{fireFighter.matricule}</span></div>
          <div className="info-row"><span className="info-label">🎖️ الرتبة</span><span className="info-value">{fireFighter.grade || 'غير محدد'}</span></div>
          <div className="info-row"><span className="info-label">🚒 وحدة التدخل</span><span className="info-value"><span className="badge unit">{fireFighter.uniteIntervention || 'غير محدد'}</span></span></div>
          <div className="info-row"><span className="info-label">📅 التاريخ</span><span className="info-value">{fireFighter.createdAt ? new Date(fireFighter.createdAt).toLocaleDateString('ar-MA') : 'N/A'}</span></div>
        </div>

        <div className="action-buttons">
          <button className="action-btn secondary" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>⬆️ للأعلى</button>
          <button className="action-btn primary" onClick={() => window.location.reload()}>🔄 تحديث</button>
        </div>
      </div>
    </div>
  );
};

export default GetSingleFireFighter;