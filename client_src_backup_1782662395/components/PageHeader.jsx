// client/src/components/PageHeader.jsx
import React from 'react';
import './PageHeader.css';
import NotificationBell from '../interfaces/components/NotificationBell';

export default function PageHeader({ greeting, title, currentUser, onBack, rightExtra, onNavigate }) {
  return (
    <div className="pgh-bar">
      <div className="pgh-left">
        {onBack && (
          <button className="pgh-back-btn" onClick={onBack}>← Back</button>
        )}
        <div>
          {greeting && <div className="pgh-greeting">{greeting}</div>}
          <h1 className="pgh-title">{title}</h1>
        </div>
      </div>
      <div className="pgh-right">
        {rightExtra}
        {currentUser && (
          <NotificationBell currentUser={currentUser} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}
