import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GetSingleTransaction.css';
import '../styles/form.css';

const API_BASE = 'http://localhost:5000/api';

const GetSingleTransaction = ({ transactionId }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!transactionId) { setTransaction(null); return; }

    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE}/transaction/${transactionId}`);
        setTransaction(response.data.transaction);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  if (!transactionId) {
    return (
      <div className="transaction-detail-page">
        <div className="transaction-card">
          <p className="placeholder-text">💳 اضغط على معاملة لعرض تفاصيلها</p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="transaction-detail-page">
      <div className="transaction-card"><p>⏳ جاري التحميل...</p></div>
    </div>
  );

  if (error) return (
    <div className="transaction-detail-page">
      <div className="transaction-card"><p className="error-message">❌ {error}</p></div>
    </div>
  );

  if (!transaction) return (
    <div className="transaction-detail-page">
      <div className="transaction-card"><p>⚠️ لم يتم العثور على المعاملة</p></div>
    </div>
  );

  return (
    <div className="transaction-detail-page">
      <div className="transaction-card">
        <div className="transaction-header">
          <div className="transaction-icon">💳</div>
          <h2 className="transaction-title">معاملة #{transaction._id?.slice(-6)}</h2>
          <span className={`status-badge ${transaction.status?.toLowerCase()}`}>
            {transaction.status}
          </span>
        </div>

        <div className="transaction-info">
          <div className="info-row">
            <span className="info-label">🆔 المعرف</span>
            <span className="info-value">{transaction._id?.slice(-8)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">💰 المبلغ</span>
            <span className="info-value amount">{transaction.amount} DZD</span>
          </div>
          <div className="info-row">
            <span className="info-label">📋 النوع</span>
            <span className="info-value">{transaction.type || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">👤 المرسل</span>
            <span className="info-value">{transaction.sender || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">📨 المستقبل</span>
            <span className="info-value">{transaction.receiver || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">📅 التاريخ</span>
            <span className="info-value">
              {transaction.createdAt 
                ? new Date(transaction.createdAt).toLocaleDateString('ar-DZ') 
                : 'N/A'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">📝 ملاحظة</span>
            <span className="info-value">{transaction.note || 'لا توجد ملاحظة'}</span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-btn secondary" 
            onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
            ⬆️ للأعلى
          </button>
          <button className="action-btn primary" 
            onClick={() => window.location.reload()}>
            🔄 تحديث
          </button>
        </div>
      </div>
    </div>
  );
};

export default GetSingleTransaction;