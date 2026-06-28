import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GetSinglePharmacist.css';
import '../styles/form.css';

const API_BASE = 'http://localhost:5000/api';

const GetSinglePharmacist = ({ pharmacistId }) => {
  const [pharmacist, setPharmacist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pharmacistId) { setPharmacist(null); return; }

    const fetchPharmacist = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE}/pharmacist/${pharmacistId}`);
        setPharmacist(response.data.pharmacist);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPharmacist();
  }, [pharmacistId]);

  if (!pharmacistId) {
    return (
      <div className="pharmacist-detail-page">
        <div className="pharmacist-card">
          <p>💊 اضغط على صيدلية لعرض تفاصيلها</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pharmacist-detail-page">
        <div className="pharmacist-card">
          <p>⏳ جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pharmacist-detail-page">
        <div className="pharmacist-card">
          <p className="error-message">❌ {error}</p>
        </div>
      </div>
    );
  }

  if (!pharmacist) {
    return (
      <div className="pharmacist-detail-page">
        <div className="pharmacist-card">
          <p>⚠️ لم يتم العثور على الصيدلية</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pharmacist-detail-page">
      <div className="pharmacist-card">
        <div className="pharmacist-header">
          <div className="pharmacist-icon">💊</div>
          <h2 className="pharmacist-name">{pharmacist.nomPharmacie}</h2>
          <p className="pharmacist-address">📍 {pharmacist.adressePharmacie}</p>
        </div>
        
        <div className="pharmacist-info">
          <div className="info-row">
            <span className="info-label">🆔 المعرف</span>
            <span className="info-value">{pharmacist.id?.slice(-8)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">👤 User ID</span>
            <span className="info-value">{pharmacist.userId?.slice(-8)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">🔢 رقم الاعتماد</span>
            <span className="info-value">
              <span className="badge agrement">{pharmacist.numAgrement}</span>
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">🌙 مناوبة ليلية</span>
            <span className="info-value">
              <span className={`badge shift ${pharmacist.isNightShift ? 'active' : ''}`}>
                {pharmacist.isNightShift ? '✅ نعم' : '❌ لا'}
              </span>
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">📅 التاريخ</span>
            <span className="info-value">
              {pharmacist.createdAt ? new Date(pharmacist.createdAt).toLocaleDateString('ar-MA') : 'N/A'}
            </span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-btn secondary" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
            ⬆️ للأعلى
          </button>
          <button className="action-btn primary" onClick={() => window.location.reload()}>
            🔄 تحديث
          </button>
        </div>
      </div>
    </div>
  );
};

export default GetSinglePharmacist;