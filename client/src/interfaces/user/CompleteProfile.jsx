import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompleteProfile.css';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [info, setInfo] = useState({
    fullName: '',
    specialty: '',
    registrationNum: '', // رقم التسجيل في عمادة الأطباء
    hospital: '',
    wilaya: ''
  });

  const handleChange = (e) => setInfo({ ...info, [e.target.name]: e.target.value });

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Saving Doctor Info:", info);
    navigate('/doctors'); // بعد الحفظ يروح لصفحة عرض الأطباء
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h3>تكملة معلومات الطبيب ⚕️</h3>
        <p>يرجى إدخال معلوماتك المهنية للتحقق من حسابك</p>
        <form onSubmit={handleSave}>
          <input type="text" name="fullName" placeholder="الاسم الكامل (دكتور...)" onChange={handleChange} required />
          <input type="text" name="specialty" placeholder="التخصص الطبي" onChange={handleChange} required />
          <input type="text" name="registrationNum" placeholder="رقم التسجيل المهني" onChange={handleChange} required />
          <input type="text" name="hospital" placeholder="المستشفى / العيادة" onChange={handleChange} required />
          <input type="text" name="wilaya" placeholder="الولاية" onChange={handleChange} required />
          <button type="submit" className="save-btn">حفظ المعلومات والدخول</button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;