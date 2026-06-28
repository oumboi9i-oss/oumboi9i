import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DirectorApprovalPage.css';

const DirectorApprovalPage = ({ currentUser, onNavigate }) => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingDemandes();
  }, []);

  const fetchPendingDemandes = async () => {
    try {
      setLoading(true);
      // جلب الطلبات اللي directorStatus ديالها pending
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/demande`);
      console.log('📥 Demandes reçues:', res.data);

      const pending = res.data.filter(d => d.directorStatus === 'pending');
      setDemandes(pending);
    } catch (error) {
      console.error('Error fetching demandes:', error);
      alert('❌ خطأ في جلب الطلبات: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذا الطلب؟ سيتم تبديل الملكية.')) return;

    setProcessingId(id);
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/demande/${id}/director-approve`);
      console.log('✅ Approve response:', response.data);

      if (response.data.success || response.status === 200) {
        alert('✅ تمت الموافقة وتبديل الملكية!');
        fetchPendingDemandes();
      } else {
        alert('❌ خطأ: ' + (response.data.message || 'حدث خطأ غير معروف'));
      }
    } catch (error) {
      console.error('❌ Error in approve:', error);
      const errorMessage = error.response?.data?.message || error.response?.data || error.message;
      alert('❌ خطأ في الموافقة: ' + errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('هل تريد رفض هذا الطلب؟')) return;

    setProcessingId(id);
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/demande/${id}/director-reject`);
      console.log('✅ Reject response:', response.data);

      if (response.data.success || response.status === 200) {
        alert('❌ تم رفض الطلب');
        fetchPendingDemandes();
      } else {
        alert('❌ خطأ: ' + (response.data.message || 'حدث خطأ غير معروف'));
      }
    } catch (error) {
      console.error('❌ Error in reject:', error);
      const errorMessage = error.response?.data?.message || error.response?.data || error.message;
      alert('❌ خطأ في الرفض: ' + errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="dir-director-page">
      <button className="dir-back-btn" onClick={() => onNavigate?.('home')}>← رجوع</button>

      <div className="dir-header">
        <h1>📋 طلبات التبديل/البيع المعلقة</h1>
        <p>مراجعة والتحقق من الطلبات قبل الموافقة النهائية</p>
      </div>

      {loading ? (
        <div className="dir-loading">⏳ جاري التحميل...</div>
      ) : demandes.length === 0 ? (
        <div className="dir-empty">✅ لا توجد طلبات معلقة حالياً</div>
      ) : (
        <div className="dir-demandes-grid">
          {demandes.map((d) => (
            <div key={d._id} className="dir-demande-card">

              <div className="dir-garde-info">
                <h3>🛡️ تفاصيل المناوبة</h3>
                <p><strong>التاريخ:</strong> {new Date(d.gardeDate).toLocaleDateString()}</p>
                <p><strong>النوع:</strong> {d.type === 'vente' ? '💰 بيع' : '🔄 تبادل'}</p>
                <p><strong>الحالة:</strong> {d.directorStatus === 'pending' ? '⏳ معلق' : d.directorStatus}</p>
              </div>

              <div className="dir-users-comparison">
                <div className="dir-user-col dir-owner">
                  <h4>👤 المالك الحالي (User A)</h4>
                  <p><strong>الاسم:</strong> {d.gardeOwner}</p>
                  <p><strong>المعرف:</strong> {d.proprietaireId?.slice(-6)}</p>
                </div>

                <div className="dir-arrow">➡️</div>

                <div className="dir-user-col dir-new-owner">
                  <h4>👤 المالك الجديد (User B)</h4>
                  <p><strong>الاسم:</strong> {d.demandeurName}</p>
                  <p><strong>المعرف:</strong> {d.demandeurId?.slice(-6)}</p>
                </div>
              </div>

              <div className="dir-actions">
                <button
                  className="dir-btn-approve"
                  onClick={() => handleApprove(d._id)}
                  disabled={processingId === d._id}
                >
                  {processingId === d._id ? '⏳ جاري...' : '✅ Valider (موافقة)'}
                </button>
                <button
                  className="dir-btn-reject"
                  onClick={() => handleReject(d._id)}
                  disabled={processingId === d._id}
                >
                  {processingId === d._id ? '⏳ جاري...' : '❌ Rejeter (رفض)'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectorApprovalPage;
