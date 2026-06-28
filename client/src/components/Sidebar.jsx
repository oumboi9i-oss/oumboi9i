// client/src/components/Sidebar.jsx
import React from 'react';
import './Sidebar.css';

export default function Sidebar({ items, activeView, onNavigate, onLogout }) {
  return (
    <div className="sb-sidebar">
      <div className="sb-logo">🏥</div>
      {items.map(({ view, icon, label }) => (
        <button
          key={view}
          className={`sb-btn ${activeView === view ? 'sb-active' : ''}`}
          onClick={() => onNavigate(view)}
        >
          {icon}
          <span className="sb-label">{label}</span>
        </button>
      ))}
      <div className="sb-spacer" />
      <button className="sb-btn" onClick={() => onNavigate('profile')}>
        👤
        <span className="sb-label">Profile</span>
      </button>
      <button className="sb-btn" onClick={onLogout}>
        🚪
        <span className="sb-label">Logout</span>
      </button>
    </div>
  );
}
