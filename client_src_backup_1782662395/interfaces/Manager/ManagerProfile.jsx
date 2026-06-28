import React, { useState } from 'react';
import './ManagerProfile.css';

const DDSProfile = ({ ddsId, currentUser, onNavigate, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    position: currentUser?.position || 'Director'
  });

  const handleSave = () => {
    if (onUpdateUser) {
      onUpdateUser(formData);
    }
    setIsEditing(false);
    alert('✅ Profile updated!');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="mdp-profile">
      {/* ✅ Back Button */}
      <button className="mdp-back-button" onClick={() => onNavigate?.('home')}>
        ← Back to Home
      </button>

      <div className="mdp-profile-header">
        <h1>👤 Manager Profile</h1>
        <p>Manage your account</p>
      </div>

      <div className="mdp-profile-card">
        <div className="mdp-profile-avatar-section">
          <div className="mdp-profile-avatar">👔</div>
          <h2>{formData.fullName || 'Manager'}</h2>
          <p className="mdp-profile-role">{formData.position}</p>
        </div>

        <div className="mdp-profile-info">
          <div className="mdp-info-group">
            <label>Full Name</label>
            {isEditing ? (
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
            ) : (
              <div className="mdp-info-value">{formData.fullName}</div>
            )}
          </div>

          <div className="mdp-info-group">
            <label>Email</label>
            {isEditing ? (
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            ) : (
              <div className="mdp-info-value">{formData.email}</div>
            )}
          </div>

          <div className="mdp-info-group">
            <label>Position</label>
            {isEditing ? (
              <input type="text" name="position" value={formData.position} onChange={handleChange} />
            ) : (
              <div className="mdp-info-value">{formData.position}</div>
            )}
          </div>
        </div>

        <div className="mdp-profile-actions">
          {isEditing ? (
            <>
              <button className="mdp-btn-save" onClick={handleSave}>✅ Save</button>
              <button className="mdp-btn-cancel" onClick={() => setIsEditing(false)}>❌ Cancel</button>
            </>
          ) : (
            <button className="mdp-btn-edit" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DDSProfile;
