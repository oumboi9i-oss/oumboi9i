// 📁 src/garde/GetSingleGarde.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GetSingleGarde.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const GetSingleGarde = ({ gardeId }) => {
  const [garde, setGarde] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 Received gardeId:', gardeId);
    
    if (!gardeId) {
      console.log('⚠️ No garde ID provided');
      setGarde(null);
      return;
    }

    const fetchGarde = async () => {
      try {
        console.log('📡 Fetching garde:', `${API_BASE}/garde/single/${gardeId}`);
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_BASE}/garde/single/${gardeId}`);
        console.log('✅ Response:', response.data);
        
        setGarde(response.data.garde);
      } catch (err) {
        console.error('❌ Error:', err);
        
        // Fallback: بحث بديل إذا الـ ID ماكانش صالح
        if (err.response?.status === 400 || err.response?.status === 404) {
          console.log('🔄 Trying fallback search...');
          try {
            const res = await axios.get(`${API_BASE}/garde/getAll`);
            const found = res.data.find(g => g._id === gardeId || g.id === gardeId);
            if (found) {
              setGarde(found);
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

    fetchGarde();
  }, [gardeId]);

  // حالة: ماكاينش ID
  if (!gardeId) {
    return (
      <div className="garde-detail-page">
        <div className="garde-card">
          <p style={{textAlign:'center',color:'#64748b',padding:'40px'}}>
            📅 اضغط على حراسة لعرض تفاصيلها
          </p>
        </div>
      </div>
    );
  }

  // حالة: جاري التحميل
  if (loading) {
    return (
      <div className="garde-detail-page">
        <div className="garde-card">
          <div className="loading-spinner">
            <p>⏳ جاري تحميل الحراسة...</p>
          </div>
        </div>
      </div>
    );
  }

  // حالة: خطأ
  if (error) {
    return (
      <div className="garde-detail-page">
        <div className="garde-card">
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
          <button 
            className="main-btn" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px' }}
          >
            🔄 إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // حالة: ما لقيناش الحراسة
  if (!garde) {
    return (
      <div className="garde-detail-page">
        <div className="garde-card">
          <p style={{textAlign:'center',padding:'40px'}}>
            ⚠️ لم يتم العثور على الحراسة
          </p>
        </div>
      </div>
    );
  }

  // ✅ دالة لعرض حالة الحراسة بلون مناسب
  const getStatusBadge = (status) => {
    const map = {
      'Active': { className: 'active', text: '🟢 نشطة' },
      'Pending': { className: 'pending', text: '🟡 قيد الانتظار' },
      'Completed': { className: 'completed', text: '✅ مكتملة' },
      'Cancelled': { className: 'cancelled', text: '❌ ملغاة' }
    };
    return map[status] || { className: '', text: status || 'غير محدد' };
  };

  const badge = getStatusBadge(garde.status);

  // ✅ عرض البيانات بنجاح
  return (
    <div className="garde-detail-page">
      <div className="garde-card">
        {/* Header */}
        <div className="garde-header">
          <div className="garde-icon">📅</div>
          <h2 className="garde-title">حراسة #{garde.id?.slice(-6) || 'N/A'}</h2>
          <p className="garde-date">
            {garde.dateGarde ? new Date(garde.dateGarde).toLocaleDateString('ar-MA', {
              year: 'numeric', month: 'long', day: 'numeric'
            }) : 'غير محدد'}
          </p>
        </div>

        {/* Info Rows */}
        <div className="garde-info">
          <div className="info-row">
            <span className="info-label">👤 المسؤول</span>
            <span className="info-value">{garde.owner || 'غير محدد'}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">🆔 المعرف</span>
            <span className="info-value" style={{fontSize:'11px'}}>{garde.id?.slice(-8) || 'N/A'}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">✅ الحالة</span>
            <span className="info-value">
              <span className={`status-badge ${badge.className}`}>
                {badge.text}
              </span>
            </span>
          </div>
          
          <div className="info-row">
            <span className="info-label">📅 تاريخ الإضافة</span>
            <span className="info-value">
              {garde.createdAt ? new Date(garde.createdAt).toLocaleDateString('ar-MA') : 'N/A'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="action-btn secondary"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ⬆️ للأعلى
          </button>
          <button 
            className="action-btn primary"
            onClick={() => window.location.reload()}
          >
            🔄 تحديث
          </button>
        </div>
      </div>
    </div>
  );
};

export default GetSingleGarde;