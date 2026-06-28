import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './PendingApproval.css';

const PendingApproval = () => {
  const navigate = useNavigate();

  return (
    <div className="pending-page">
      <div className="pending-card">

        <img src={logo} alt="SwitchGard" className="pending-logo" />

        <div className="pending-icon-wrap">
          <div className="pending-clock">⏳</div>
        </div>

        <h1 className="pending-title">Account Pending Approval</h1>

        <p className="pending-subtitle">
          Thank you for registering on <strong>SwitchGard</strong>.
        </p>

        <div className="pending-info-box">
          <div className="pending-info-row">
            <span className="pending-info-icon">📋</span>
            <span>Your account has been created and is currently under review by the relevant manager.</span>
          </div>
          <div className="pending-info-row">
            <span className="pending-info-icon">👔</span>
            <span>A manager or administrator will review your registration details and approve your access shortly.</span>
          </div>
          <div className="pending-info-row">
            <span className="pending-info-icon">🔔</span>
            <span>Once approved, you will be able to log in using your email and password.</span>
          </div>
          <div className="pending-info-row">
            <span className="pending-info-icon">📞</span>
            <span>If you have been waiting too long, please contact your facility administrator.</span>
          </div>
        </div>

        <div className="pending-status-badge">
          <span className="pending-dot" />
          Waiting for approval
        </div>

        <button className="pending-back-btn" onClick={() => navigate('/')}>
          ← Back to Login
        </button>

      </div>
    </div>
  );
};

export default PendingApproval;
