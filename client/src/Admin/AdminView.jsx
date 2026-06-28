// client/src/Admin/AdminView.jsx
import React, { useState, useEffect } from 'react';
import './AdminView.css';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';

import AddDoctor from '../Doctor/AddDoctor';
import ManageDoctor from '../Doctor/ManageDoctor';
import GetSingleDoctor from '../Doctor/GetSingleDoctor';
import AddNurse from '../Nurse/AddNurse';
import ManageNurse from '../Nurse/ManageNurse';
import GetSingleNurse from '../Nurse/GetSingleNurse';
import AddPharmacist from '../pharmacist/AddPharmacist';
import ManagePharmacist from '../pharmacist/ManagePharmacist';
import GetSinglePharmacist from '../pharmacist/GetSinglePharmacist';
import AddFireFighter from '../FireFighter/AddFireFighter';
import ManageFireFighter from '../FireFighter/ManageFireFighter';
import GetSingleFireFighter from '../FireFighter/GetSingleFireFighter';
import AddDDS from '../Manager/AddManager';
import ManageDDS from '../Manager/ManageManager';
import GetSingleDDS from '../Manager/GetSingleManager';
import AddMessage from '../message/AddMessage';
import ManageMessage from '../message/ManageMessage';
import GetSingleMessage from '../message/GetSingleMessage';
import AddGarde from '../garde/AddGarde';
import ManageGarde from '../garde/ManageGarde';
import GetSingleGarde from '../garde/GetSingleGarde';
import SmartContract from '../transaction/SmartContract';
import SendEmail from '../Email/SendEmail';
import GetSingleEmail from '../Email/GetSingleEmail';
import PendingAccounts from './PendingAccounts'; 
import NotificationBell from '../interfaces/components/NotificationBell';

const SIDEBAR_ITEMS = [
  { view: 'dashboard', icon: '🛡️', label: 'Dashboard' },
  { view: 'pending',   icon: '⏳',  label: 'Approvals' },
];

const MODULES = [
  { key: 'doctors',       icon: '👨‍⚕️', name: 'Doctors',       desc: 'Add & manage doctors' },
  { key: 'nurses',        icon: '👩‍⚕️', name: 'Nurses',        desc: 'Add & manage nurses' },
  { key: 'pharmacists',   icon: '💊',   name: 'Pharmacists',   desc: 'Add & manage pharmacists' },
  { key: 'firefighters',  icon: '🚒',   name: 'Firefighters',  desc: 'Add & manage firefighters' },
  { key: 'dds',           icon: '👔',   name: 'Managers',      desc: 'Add & manage managers' },
  { key: 'guards',        icon: '🛡️',  name: 'Shifts',        desc: 'Manage staff shifts' },
  { key: 'messages',      icon: '💬',   name: 'Messages',      desc: 'All messages' },
  { key: 'smartcontract', icon: '⛓️',  name: 'Smart Contract', desc: 'Commission ledger & shift swap payments' },
  { key: 'emails',        icon: '📧',   name: 'Emails',        desc: 'Send & manage emails' },
  { key: 'pending',       icon: '⏳',   name: 'Approvals',     desc: 'Approve new accounts' },
];

function AdminView({ currentUser, onLogout }) {
  const [activeModule, setActiveModule]                   = useState(null);
  const [showAddModal, setShowAddModal]                   = useState(false);
  const [selectedDoctorId, setSelectedDoctorId]           = useState(null);
  const [selectedNurseId, setSelectedNurseId]             = useState(null);
  const [selectedPharmacistId, setSelectedPharmacistId]   = useState(null);
  const [selectedFireFighterId, setSelectedFireFighterId] = useState(null);
  const [selectedManagerId, setSelectedManagerId]         = useState(null);
  const [selectedMessageId, setSelectedMessageId]         = useState(null);
  const [selectedGardeId, setSelectedGardeId]             = useState(null);
  const [selectedEmailId, setSelectedEmailId]             = useState(null);

  useEffect(() => { setShowAddModal(false); }, [activeModule]);

  const handleSidebarNavigate = (view) => {
    if (view === 'dashboard') setActiveModule(null);
    else setActiveModule(view);
  };

  const openModal  = () => setShowAddModal(true);
  const closeModal = () => setShowAddModal(false);

  function AddModal({ title, children }) {
    if (!showAddModal) return null;
    return (
      <div className="av-modal-overlay" onClick={closeModal}>
        <div className="av-modal" onClick={e => e.stopPropagation()}>
          <div className="av-modal-header">
            <span className="av-modal-title">{title}</span>
            <button className="av-modal-close" onClick={closeModal}>✕</button>
          </div>
          <div className="av-modal-body">{children}</div>
        </div>
      </div>
    );
  }

  const moduleContent = {
    doctors: (
      <>
        <div className="av-mod-bar">
          <button className="av-add-btn" onClick={openModal}>➕ Add Doctor</button>
        </div>
        <ManageDoctor onSelectDoctor={setSelectedDoctorId} />
        <GetSingleDoctor doctorId={selectedDoctorId} />
        <AddModal title="👨‍⚕️ Add Doctor"><AddDoctor /></AddModal>
      </>
    ),
    nurses: (
      <>
        <div className="av-mod-bar">
          <button className="av-add-btn" onClick={openModal}>➕ Add Nurse</button>
        </div>
        <ManageNurse onSelectNurse={setSelectedNurseId} />
        <GetSingleNurse nurseId={selectedNurseId} />
        <AddModal title="👩‍⚕️ Add Nurse"><AddNurse /></AddModal>
      </>
    ),
    pharmacists: (
      <>
        <div className="av-mod-bar">
          <button className="av-add-btn" onClick={openModal}>➕ Add Pharmacist</button>
        </div>
        <ManagePharmacist onSelectPharmacist={setSelectedPharmacistId} />
        <GetSinglePharmacist pharmacistId={selectedPharmacistId} />
        <AddModal title="💊 Add Pharmacist"><AddPharmacist /></AddModal>
      </>
    ),
    firefighters: (
      <>
        <div className="av-mod-bar">
          <button className="av-add-btn" onClick={openModal}>➕ Add Firefighter</button>
        </div>
        <ManageFireFighter onSelectFireFighter={setSelectedFireFighterId} />
        <GetSingleFireFighter fireFighterId={selectedFireFighterId} />
        <AddModal title="🚒 Add Firefighter"><AddFireFighter /></AddModal>
      </>
    ),
    dds: (
      <>
        <div className="av-mod-bar">
          <button className="av-add-btn" onClick={openModal}>➕ Add Manager</button>
        </div>
        <ManageDDS onSelectDDS={setSelectedManagerId} />
        <GetSingleDDS ddsId={selectedManagerId} />
        <AddModal title="👔 Add Manager"><AddDDS /></AddModal>
      </>
    ),
    guards: (
      <>
        <div className="av-mod-bar">
          <button className="av-add-btn" onClick={openModal}>➕ Add Shift</button>
        </div>
        <ManageGarde onSelectGarde={setSelectedGardeId} />
        <GetSingleGarde gardeId={selectedGardeId} />
        <AddModal title="🛡️ Add Shift"><AddGarde currentUser={currentUser} /></AddModal>
      </>
    ),
    messages: (
      <>
        <div className="av-mod-bar">
          <button className="av-add-btn" onClick={openModal}>➕ New Message</button>
        </div>
        <ManageMessage onSelectMessage={setSelectedMessageId} />
        <GetSingleMessage messageId={selectedMessageId} />
        <AddModal title="💬 New Message"><AddMessage /></AddModal>
      </>
    ),
    smartcontract: <SmartContract />,
    emails: (
      <>
        <div className="av-mod-bar">
          <button className="av-add-btn" onClick={openModal}>📧 Compose Email</button>
        </div>
        <GetSingleEmail emailId={selectedEmailId} />
        <AddModal title="📧 Compose Email">
          <SendEmail onEmailSent={(id) => { setSelectedEmailId(id); closeModal(); }} />
        </AddModal>
      </>
    ),
    pending: <PendingAccounts />,
  };

  const activeItem = activeModule ? MODULES.find(m => m.key === activeModule) : null;

  return (
    <div className="av-wrapper role-admin">
      <Sidebar
        items={SIDEBAR_ITEMS}
        activeView={activeModule || 'dashboard'}
        onNavigate={handleSidebarNavigate}
        onLogout={onLogout}
      />
      <div className="av-main">
  <div style={{ position: 'relative' }}>
    <PageHeader
      greeting="Admin Control Panel"
      title={currentUser?.email || 'Administrator'}
      currentUser={currentUser}
      onBack={activeModule ? () => setActiveModule(null) : null}
    />
    <div style={{ position: 'absolute', top: '50%', right: 24, transform: 'translateY(-50%)', zIndex: 100 }}>
      <NotificationBell
        currentUser={currentUser}
        onNavigate={(view) => setActiveModule(view)}
      />
    </div>
  </div>
        <div className="av-content">
          {activeItem ? (
            <>
              <div className="av-module-content-title">{activeItem.icon} {activeItem.name}</div>
              <div className="av-module-content">{moduleContent[activeModule]}</div>
            </>
          ) : (
            <>
              <p className="av-page-title">Select a module to manage</p>
              <div className="av-modules-title">Modules</div>
              <div className="av-grid">
                {MODULES.map(({ key, icon, name, desc }) => (
                  <div key={key} className="av-module-card" onClick={() => setActiveModule(key)}>
                    <div className="av-module-icon">{icon}</div>
                    <p className="av-module-name">{name}</p>
                    <p className="av-module-desc">{desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminView;