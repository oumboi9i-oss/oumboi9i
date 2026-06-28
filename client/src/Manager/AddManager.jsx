import React, { useState } from 'react';
import axios from 'axios';
import './AddManager.css';
import '../styles/form.css';

const MANAGER_TYPES = [
  { value: 'doctor',      label: '👨‍⚕️ Doctors Manager' },
  { value: 'nurse',       label: '👩‍⚕️ Nurses Manager' },
  { value: 'pharmacist',  label: '💊 Pharmacists Manager' },
  { value: 'firefighter', label: '🚒 Firefighters Manager' },
];

const AddDDS = () => {
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', position: '', managerType: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }
    if (!formData.managerType) {
      setMessage('❌ Please select a manager type');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/api/account/admin-register`, {
        email:       formData.email,
        password:    formData.password,
        role:        'manager',
        fullName:    formData.fullName,
        managerType: formData.managerType,
        position:    formData.position || 'Manager',
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessage('✅ Manager created successfully!');
      setFormData({ email: '', password: '', confirmPassword: '', fullName: '', position: '', managerType: '' });
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message || 'Unknown error';
      setMessage(`❌ [${status || 'ERR'}] ${msg}`);
      console.error('Manager creation error:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-dds form-card">
      <h2>👔 Add New Manager</h2>

      {message && (
        <div className={`message form-status ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="dds-form">
        <div className="form-group">
          <label>Manager Type *</label>
          <select name="managerType" value={formData.managerType} onChange={handleChange} required>
            <option value="">-- Select manager type --</option>
            {MANAGER_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Full Name *</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Enter full name" />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" />
        </div>

        <div className="form-group">
          <label>Position</label>
          <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="e.g. Head of Doctors" />
        </div>

        <div className="form-group">
          <label>Password *</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Minimum 6 characters" />
        </div>

        <div className="form-group">
          <label>Confirm Password *</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Re-enter password" />
        </div>

        <button type="submit" className="btn-submit form-btn" disabled={loading}>
          {loading ? '⏳ Creating...' : '✅ Create Manager Account'}
        </button>
      </form>
    </div>
  );
};

export default AddDDS;
