import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';
import './Login.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

// Map each role to its API endpoint
const ROLE_API = {
  doctor:      'doctor',
  nurse:       'nurse',
  pharmacist:  'pharmacist',
  firefighter: 'firefighter',
  manager:     'manager',
};

// Extract the display name from any user object
const extractName = (u) =>
  u?.fullName || u?.nomPharmacie || u?.nom || u?.name || u?.username || u?.email || '';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', role: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const roles = [
    { id: 'doctor',      label: 'Doctor',      emoji: '👨‍⚕️' },
    { id: 'nurse',       label: 'Nurse',       emoji: '👩‍⚕️' },
    { id: 'pharmacist',  label: 'Pharmacist',  emoji: '💊'  },
    { id: 'firefighter', label: 'Firefighter', emoji: '🚒'  },
    { id: 'manager',     label: 'Manager',     emoji: '👔'  },
    { id: 'admin',       label: 'Admin',       emoji: '🛡️'  },
  ];

  const handleChange     = (e)      => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleRoleChange = (roleId) => { setFormData({ ...formData, role: formData.role === roleId ? '' : roleId }); setError(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { setError('⚠️ Please enter email and password'); return; }
    if (!formData.role)                         { setError('⚠️ Please select your role');         return; }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/account/login`, {
        email:    formData.email,
        password: formData.password,
        role:     formData.role,
      });

      if (response.data.success || response.data.token) {
        let userData = response.data.user || response.data.userData || {};

        // ── Enrich userData with fullName from role API if missing ──
        if (!extractName(userData) && ROLE_API[formData.role]) {
          try {
            const profileRes = await axios.get(
              `${API_BASE}/${ROLE_API[formData.role]}/getAll`,
              { headers: { Authorization: `Bearer ${response.data.token}` } }
            );
            const all = Array.isArray(profileRes.data) ? profileRes.data : [];
            const match = all.find(p => p.email === formData.email || p._id === userData.id || p._id === userData._id);
            if (match) {
              userData = {
                ...userData,
                fullName:      match.fullName      || userData.fullName,
                nomPharmacie:  match.nomPharmacie  || userData.nomPharmacie,
                specialty:     match.specialty     || userData.specialty,
                location:      match.location      || userData.location,
                position:      match.position      || userData.position,
                profileId:     match._id,
              };
            }
          } catch { /* silently ignore enrichment failure */ }
        }

        // Always ensure displayName is set
        userData = {
          ...userData,
          displayName: extractName(userData) || formData.email,
          role: userData?.role || formData.role,
        };

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));

        if (onLoginSuccess) onLoginSuccess(userData);

        navigate('/dashboard');
      }
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message || '';
      if (status === 403 && message.includes('pending')) {
        navigate('/pending-approval');
      } else if (status === 403) {
        const match = message.match(/'([^']+)'/);
        setError(`❌ Wrong role! This account is registered as "${match ? match[1] : '?'}"`);
      } else if (status === 401) {
        setError('❌ Invalid email or password');
      } else if (status === 400) {
        setError('⚠️ Please fill all fields');
      } else {
        setError('❌ Server error, please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-container">
          <img src={logo} alt="SwitchGard Logo" className="login-logo" />
          <p className="tagline">Let's get started!</p>
        </div>

        {error && <div className="status-message error">{error}</div>}

        <form onSubmit={handleLogin}>
          <input type="email"    name="email"    placeholder="📧 Email"    value={formData.email}    onChange={handleChange} required />
          <input type="password" name="password" placeholder="🔐 Password" value={formData.password} onChange={handleChange} required />

          <div className="role-section">
            <p className="role-title">🎯 Select your role:</p>
            <div className="role-checkboxes-grid">
              {roles.map(role => (
                <label key={role.id} className={`role-checkbox-item ${formData.role === role.id ? 'selected' : ''}`}>
                  <input type="checkbox" checked={formData.role === role.id} onChange={() => handleRoleChange(role.id)} />
                  <span className="role-checkbox-label">
                    <span className="role-emoji">{role.emoji}</span>
                    <span>{role.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="main-btn" disabled={loading}>
            {loading ? '⏳ Logging in...' : '🚀 Login'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/signup" className="signup-link">📝 Don't have an account? Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;