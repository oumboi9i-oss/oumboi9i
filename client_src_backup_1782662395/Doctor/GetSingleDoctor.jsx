// 📁 src/Doctor/GetSingleDoctor.jsx
import React, { useEffect, useState } from 'react';  // ✅ ماكاينش useCallback هنا
import axios from 'axios';
import './GetSingleDoctor.css';
import '../styles/form.css';

const API_BASE = 'http://localhost:5000/api';

const GetSingleDoctor = ({ doctorId }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 Received doctorId (_id):', doctorId);
    
    if (!doctorId) { 
      setDoctor(null); 
      return; 
    }

    const fetchDoctor = async () => {
      try {
        console.log('📡 Fetching from API:', `${API_BASE}/doctor/${doctorId}`);
        setLoading(true); 
        setError(null);
        
        const response = await axios.get(`${API_BASE}/doctor/${doctorId}`);
        console.log('✅ Response:', response.data);
        setDoctor(response.data.doctor);
        
      } catch (err) {
        console.error('❌ Error:', err);
        setError(err.response?.data?.message || err.message);
      } finally { 
        setLoading(false); 
      }
    };

    fetchDoctor();
  }, [doctorId]);

  // حالة: ماكاينش ID
  if (!doctorId) {
    return (
      <div className="doctor-detail-page">
        <div className="doctor-card">
          <p style={{textAlign:'center',color:'#64748b',padding:'40px'}}>
            👆 اضغط على زر "👁️ View" فـ جدول الأطباء لعرض التفاصيل
          </p>
        </div>
      </div>
    );
  }

  // حالة: جاري التحميل
  if (loading) {
    return (
      <div className="doctor-detail-page">
        <div className="doctor-card">
          <div className="loading-spinner"><p>⏳ جاري التحميل...</p></div>
        </div>
      </div>
    );
  }

  // حالة: خطأ
  if (error) {
    return (
      <div className="doctor-detail-page">
        <div className="doctor-card">
          <div className="error-message"><p>❌ {error}</p></div>
          <button className="main-btn" onClick={() => window.location.reload()} style={{marginTop:'20px'}}>🔄 إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  // حالة: ما لقيناش الطبيب
  if (!doctor) {
    return (
      <div className="doctor-detail-page">
        <div className="doctor-card">
          <p style={{textAlign:'center',padding:'40px'}}>⚠️ لم يتم العثور على الطبيب</p>
        </div>
      </div>
    );
  }

  // ✅ عرض البيانات بنجاح
  return (
    <div className="doctor-detail-page">
      <div className="doctor-card">
        <div className="doctor-avatar">{doctor.fullName?.charAt(0).toUpperCase()}</div>
        <h2 className="doctor-name">{doctor.fullName}</h2>
        <p className="doctor-specialty">{doctor.specialty}</p>
        
        <div className="doctor-info">
          <div className="info-row">
            <span className="info-label">📧 الإيميل</span>
            <span className="info-value">{doctor.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">🔢 رقم القيد</span>
            <span className="info-value">{doctor.numOrdre}</span>
          </div>
          <div className="info-row">
            <span className="info-label">📍 الموقع</span>
            <span className="info-value">{doctor.location || 'غير محدد'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">✅ الحالة</span>
            <span className="info-value">
              <span className={`status-badge ${doctor.isAvailable ? 'available' : 'unavailable'}`}>
                {doctor.isAvailable ? 'متاح' : 'غير متاح'}
              </span>
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">📅 التاريخ</span>
            <span className="info-value">
              {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString('ar-MA') : 'N/A'}
            </span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-btn secondary" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>⬆️ للأعلى</button>
          <button className="action-btn primary" onClick={() => window.location.reload()}>🔄 تحديث</button>
        </div>
      </div>
    </div>
  );
};

export default GetSingleDoctor;