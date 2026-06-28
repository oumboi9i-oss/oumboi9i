// client/src/components/BottomNav.jsx
import React from 'react';
import './BottomNav.css';

export default function BottomNav({ items, activeView, onNavigate }) {
  return (
    <div className="bn-bar">
      {items.map(({ view, icon, label }) => (
        <button
          key={view}
          className={`bn-tab ${activeView === view ? 'bn-active' : ''}`}
          onClick={() => onNavigate(view)}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
