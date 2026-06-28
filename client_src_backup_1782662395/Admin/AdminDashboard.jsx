// src/AdminDashboard.js
import React from 'react';
import './AdminDashboard.css'; // تأكد من إنشاء ملف الـ CSS أو احذف هذا السطر

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>🛡️ Admin Control Panel</h2>
        <p className="admin-subtitle">Full access to all modules - Manage everything</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-icon">👨‍⚕️</span>
          <h3>Doctors</h3>
          <p>Add & Manage all doctors</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👩‍⚕️</span>
          <h3>Nurses</h3>
          <p>Add & Manage all nurses</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💊</span>
          <h3>Pharmacists</h3>
          <p>Add & Manage all pharmacists</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🚒</span>
          <h3>Firefighters</h3>
          <p>Add & Manage all firefighters</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🛡️</span>
          <h3>Guards</h3>
          <p>Manage all guards</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💬</span>
          <h3>Messages</h3>
          <p>Manage all messages</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <h3>Transactions</h3>
          <p>Manage all transactions</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📧</span>
          <h3>Emails</h3>
          <p>Send & manage emails</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;