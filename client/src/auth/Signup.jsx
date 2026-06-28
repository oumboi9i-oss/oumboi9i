import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Signup.css';

const Signup = ({ onSignupSuccess }) => {
  const navigate = useNavigate();

  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole]       = useState('');

  // Doctor
  const [fullName, setFullName]   = useState('');
  const [specialty, setSpecialty] = useState('');
  const [numOrdre, setNumOrdre]   = useState('');

  // Nurse
  const [nurseFullName, setNurseFullName] = useState('');
  const [diplome, setDiplome] = useState('');
  const [service, setService] = useState('');
  const [equipe, setEquipe]   = useState('');

  // Pharmacist
  const [pharmacistFullName, setPharmacistFullName] = useState('');
  const [nomPharmacie, setNomPharmacie] = useState('');
  const [numAgrement, setNumAgrement]   = useState('');

  // Firefighter
  const [ffFullName, setFfFullName]               = useState('');
  const [matricule, setMatricule]               = useState('');
  const [grade, setGrade]                       = useState('');
  const [uniteIntervention, setUniteIntervention] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const specialtyOptions = ['Cardiology','Pediatrics','Dermatology','Orthopedics','Neurology','General Practice','Surgery','Psychiatry'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (password !== confirmPassword) { setError('⚠️ Passwords do not match'); setLoading(false); return; }
    if (!selectedRole)                { setError('⚠️ Please select a role');    setLoading(false); return; }

    let additionalData = {};
    switch (selectedRole) {
      case 'doctor':
        additionalData = { fullName, specialty, numOrdre };
        break;
      case 'nurse':
        additionalData = { fullName: nurseFullName, diplome, service, equipe };
        break;
      case 'pharmacist':
        additionalData = { fullName: pharmacistFullName, nomPharmacie, numAgrement };
        break;
      case 'firefighter':
        additionalData = { fullName: ffFullName, matricule, grade, uniteIntervention };
        break;
      default: break;
    }

    const formData = { email: email.toLowerCase(), password, role: selectedRole, ...additionalData };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/account/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.pending) {
        navigate('/pending-approval');
      } else if (data.token) {
        // Shouldn't happen for public signup, but handle just in case
        const userData = data.user || {};
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        if (onSignupSuccess) onSignupSuccess(userData);
        navigate('/dashboard');
      } else {
        setError(data.message || '❌ Registration failed');
      }
    } catch (err) {
      setError('❌ Server error, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">

        <div className="logo-container">
          <img src={logo} alt="SwitchGard Logo" className="signup-logo" />
          <p className="tagline">Join the medical guard management platform</p>
        </div>

        {error   && <div className="status-message error">{error}</div>}
        {success && <div className="status-message success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* ── Basic Info ── */}
          <input type="email"    placeholder="📧 Email Address"    value={email}           onChange={e=>setEmail(e.target.value)}           required />
          <input type="password" placeholder="🔐 Password"         value={password}        onChange={e=>setPassword(e.target.value)}        required />
          <input type="password" placeholder="🔐 Confirm Password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />

          {/* ── Role ── */}
          <select value={selectedRole} onChange={e=>setSelectedRole(e.target.value)} required className="form-select">
            <option value="">-- Select Your Role --</option>
            <option value="doctor">👨‍⚕️ Doctor</option>
            <option value="nurse">👩‍⚕️ Nurse</option>
            <option value="pharmacist">💊 Pharmacist</option>
            <option value="firefighter">🚒 Firefighter</option>
          </select>

          {/* ── Doctor Fields ── */}
          {selectedRole === 'doctor' && (
            <div className="role-fields-section">
              <p className="role-fields-title">👨‍⚕️ Doctor Information</p>
              <input type="text" placeholder="👤 Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} required />
              <select value={specialty} onChange={e=>setSpecialty(e.target.value)} required className="form-select">
                <option value="">-- Select Specialty --</option>
                {specialtyOptions.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <input type="text" placeholder="🔢 Num Ordre" value={numOrdre} onChange={e=>setNumOrdre(e.target.value)} required />
            </div>
          )}

          {/* ── Nurse Fields ── */}
          {selectedRole === 'nurse' && (
            <div className="role-fields-section">
              <p className="role-fields-title">👩‍⚕️ Nurse Information</p>
              <input type="text" placeholder="👤 Full Name" value={nurseFullName} onChange={e=>setNurseFullName(e.target.value)} required />
              <select value={diplome} onChange={e=>setDiplome(e.target.value)} required className="form-select">
                <option value="">-- Select Diploma --</option>
                <option value="IDE">IDE</option>
                <option value="ISP">ISP</option>
              </select>
              <input type="text" placeholder="🏥 Service" value={service} onChange={e=>setService(e.target.value)} required />
              <input type="text" placeholder="👥 Equipe"  value={equipe}  onChange={e=>setEquipe(e.target.value)}  required />
            </div>
          )}

          {/* ── Pharmacist Fields ── */}
          {selectedRole === 'pharmacist' && (
            <div className="role-fields-section">
              <p className="role-fields-title">💊 Pharmacist Information</p>
              <input type="text" placeholder="👤 Full Name"       value={pharmacistFullName} onChange={e=>setPharmacistFullName(e.target.value)} required />
              <input type="text" placeholder="🏪 Pharmacy Name"   value={nomPharmacie}       onChange={e=>setNomPharmacie(e.target.value)}       required />
              <input type="text" placeholder="📋 Approval Number" value={numAgrement}        onChange={e=>setNumAgrement(e.target.value)}        required />
            </div>
          )}

          {/* ── Firefighter Fields ── */}
          {selectedRole === 'firefighter' && (
            <div className="role-fields-section">
              <p className="role-fields-title">🚒 Firefighter Information</p>
              <input type="text" placeholder="👤 Full Name" value={ffFullName}          onChange={e=>setFfFullName(e.target.value)}          required />
              <input type="text" placeholder="🔢 Matricule" value={matricule}           onChange={e=>setMatricule(e.target.value)}           required />
              <input type="text" placeholder="⭐ Grade"     value={grade}               onChange={e=>setGrade(e.target.value)}               required />
              <input type="text" placeholder="🚒 Unit"      value={uniteIntervention}   onChange={e=>setUniteIntervention(e.target.value)}   required />
            </div>
          )}

          <button type="submit" className="main-btn" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '✅ Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <button onClick={()=>navigate('/')} className="signup-link">Already have an account? Sign in</button>
        </div>
      </div>
    </div>
  );
};

export default Signup;