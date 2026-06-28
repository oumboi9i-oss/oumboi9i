// client/src/App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./login/Login";
import Signup from "./auth/Signup";
import PendingApproval from "./auth/PendingApproval";
import AdminView from "./Admin/AdminView";

import Sidebar from "./components/Sidebar";
import PageHeader from "./components/PageHeader";

import DoctorHome from "./interfaces/Doctor/DoctorHome";
import DoctorGard from "./interfaces/Doctor/DoctorGard";
import DoctorMessage from "./interfaces/Doctor/DoctorMessage";
import DoctorProfile from "./interfaces/Doctor/DoctorProfile";

import NurseHome from "./interfaces/Nurse/NurseHome";
import NurseGarde from "./interfaces/Nurse/NurseGarde";
import NurseMessage from "./interfaces/Nurse/NurseMessage";
import NurseProfile from "./interfaces/Nurse/NurseProfile";

import PharmacistHome from "./interfaces/Pharmacist/PharmacistHome";
import PharmacistGarde from "./interfaces/Pharmacist/PharmacistGarde";
import PharmacistMessage from "./interfaces/Pharmacist/PharmacistMessage";
import PharmacistProfile from "./interfaces/Pharmacist/PharmacistProfile";

import FirefighterHome from "./interfaces/FireFighter/FirefighterHome";
import FirefighterGarde from "./interfaces/FireFighter/FirefighterGarde";
import FirefighterMessage from "./interfaces/FireFighter/FirefighterMessage";
import FireFighterProfile from "./interfaces/FireFighter/FireFighterProfile";

import ManagerHome from './interfaces/Manager/ManagerHome';
import ManagerGarde from './interfaces/Manager/ManagerGarde';
import ManagerMessage from './interfaces/Manager/ManagerMessage';
import ManagerNotifications from './interfaces/Manager/ManagerNotifications';
import ManagerProfile from './interfaces/Manager/ManagerProfile';

import DemandesPage from "./interfaces/components/DemandesPage";
import DirectorApprovalPage from "./interfaces/components/DirectorApprovalPage";
import LocationSetup from "./interfaces/user/LocationSetup";

// ── NAV CONFIG PER ROLE ──────────────────────────────────────────
// manager no longer has a "Messages" tab — it's replaced by a Notifications
// history page (the bell icon dropdown stays for live/unread alerts).
const NAV = {
  doctor:     [{ view:'home',icon:'🏠',label:'Home' },{ view:'message',icon:'💬',label:'Messages' },{ view:'garde',icon:'🛡',label:'Shifts' }],
  nurse:      [{ view:'home',icon:'🏠',label:'Home' },{ view:'messages',icon:'💬',label:'Messages' },{ view:'garde',icon:'🛡',label:'Shifts' }],
  pharmacist: [{ view:'home',icon:'🏠',label:'Home' },{ view:'messages',icon:'💬',label:'Messages' },{ view:'garde',icon:'🛡',label:'Shifts' }],
  firefighter:[{ view:'home',icon:'🏠',label:'Home' },{ view:'messages',icon:'💬',label:'Messages' },{ view:'garde',icon:'🛡',label:'Shifts' }],
  manager:    [{ view:'home',icon:'🏠',label:'Home' },{ view:'messages',icon:'💬',label:'Messages' },{ view:'notifications',icon:'🔔',label:'Notifications' },{ view:'garde',icon:'🛡',label:'Shifts' }],
};

// ── ROLE SHELL (shared wrapper for all field roles) ──────────────
function RoleShell({ role, roleClass, currentUser, onLogout, onUpdateUser, children, view, onNavigate }) {
  const navItems = NAV[role] || [];
  return (
    <div className={`role-shell ${roleClass}`}>
      <Sidebar items={navItems} activeView={view} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="role-content">
        <PageHeader
          greeting={`Welcome`}
          title={currentUser?.fullName || currentUser?.userId || currentUser?.nomPharmacie || currentUser?.matricule || role}
          currentUser={currentUser}
          onNavigate={onNavigate}
        />
        <div className="role-body">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── ROLE VIEWS ───────────────────────────────────────────────────
function DoctorView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView]           = useState("home");
  const [profileId, setProfileId] = useState(currentUser?.id || null);
  const [openUserName, setOpenUserName] = useState(null);

  const nav = (newView, param = null) => {
    if (param && typeof param === 'object') {
      if (param.openUserName) setOpenUserName(param.openUserName);
    } else {
      if (param) setProfileId(param);
      setOpenUserName(null);
    }
    setView(newView);
  };

  return (
    <RoleShell role="doctor" roleClass="role-doctor" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
      {view === "home"                              && <DoctorHome onNavigate={nav} currentUser={currentUser} />}
      {view === "garde"                             && <DoctorGard onNavigate={nav} currentUser={currentUser} />}
      {(view === "message" || view === "messages")  && <DoctorMessage onNavigate={nav} currentUser={currentUser} openUserName={openUserName} />}
      {view === "profile"                           && <DoctorProfile doctorId={profileId || currentUser?.id} onNavigate={nav} onUpdateUser={onUpdateUser} />}
      {view === "demandes"                          && <DemandesPage currentUser={currentUser} role="doctor" onNavigate={nav} />}
      {view === "director"                          && <DirectorApprovalPage currentUser={currentUser} role="doctor" onNavigate={nav} />}
    </RoleShell>
  );
}

function NurseView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView]             = useState("home");
  const [nurseId, setNurseId]       = useState(currentUser?.id || null);
  const [openUserName, setOpenUserName] = useState(null);

  const nav = (v, param = null) => {
    if (param && typeof param === 'object') {
      if (param.openUserName) setOpenUserName(param.openUserName);
    } else {
      if (param) setNurseId(param);
      setOpenUserName(null);
    }
    setView(v);
  };

  return (
    <RoleShell role="nurse" roleClass="role-nurse" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
      {view === "home"     && <NurseHome onNavigate={nav} currentUser={currentUser} />}
      {view === "garde"    && <NurseGarde onNavigate={nav} currentUser={currentUser} />}
      {view === "messages" && <NurseMessage onNavigate={nav} currentUser={currentUser} openUserName={openUserName} />}
      {view === "profile"  && <NurseProfile nurseId={nurseId || currentUser?.id} onNavigate={nav} onUpdateUser={onUpdateUser} />}
      {view === "demandes" && <DemandesPage currentUser={currentUser} role="nurse" onNavigate={nav} />}
      {view === "director" && <DirectorApprovalPage currentUser={currentUser} role="nurse" onNavigate={nav} />}
    </RoleShell>
  );
}

// FIX: this view was missing a `profileId` state entirely. handleCardClick in
// PharmacistHome calls onNavigate("profile", pharmacistId), but the old `nav`
// only ever called setOpenUserName(null) in the else-branch and dropped the
// clicked id on the floor — so <PharmacistProfile> always rendered with
// pharmacistId={currentUser?.id}, showing the logged-in user's own profile
// instead of whichever card was clicked. Now mirrors DoctorView/NurseView.
function PharmacistView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView]                 = useState("home");
  const [profileId, setProfileId]       = useState(currentUser?.id || null);
  const [openUserName, setOpenUserName] = useState(null);

  const nav = (v, param = null) => {
    if (param && typeof param === 'object') {
      if (param.openUserName) setOpenUserName(param.openUserName);
    } else {
      if (param) setProfileId(param);
      setOpenUserName(null);
    }
    setView(v);
  };

  return (
    <RoleShell role="pharmacist" roleClass="role-pharmacist" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
      {view === "home"     && <PharmacistHome onNavigate={nav} currentUser={currentUser} />}
      {view === "garde"    && <PharmacistGarde onNavigate={nav} currentUser={currentUser} />}
      {view === "messages" && <PharmacistMessage onNavigate={nav} currentUser={currentUser} openUserName={openUserName} />}
      {view === "profile"  && <PharmacistProfile pharmacistId={profileId || currentUser?.id} onNavigate={nav} onUpdateUser={onUpdateUser} />}
      {view === "demandes" && <DemandesPage currentUser={currentUser} role="pharmacist" onNavigate={nav} />}
      {view === "director" && <DirectorApprovalPage currentUser={currentUser} role="pharmacist" onNavigate={nav} />}
    </RoleShell>
  );
}

// FIX: same bug as PharmacistView had — no profileId state, so clicking any
// firefighter card would have shown the logged-in user's own profile instead
// of the one that was clicked. Added profileId state to match DoctorView.
function FirefighterView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView]                 = useState("home");
  const [profileId, setProfileId]       = useState(currentUser?.id || null);
  const [openUserName, setOpenUserName] = useState(null);

  const nav = (v, param = null) => {
    if (param && typeof param === 'object') {
      if (param.openUserName) setOpenUserName(param.openUserName);
    } else {
      if (param) setProfileId(param);
      setOpenUserName(null);
    }
    setView(v);
  };

  return (
    <RoleShell role="firefighter" roleClass="role-firefighter" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
      {view === "home"     && <FirefighterHome onNavigate={nav} currentUser={currentUser} />}
      {view === "garde"    && <FirefighterGarde onNavigate={nav} currentUser={currentUser} />}
      {view === "messages" && <FirefighterMessage onNavigate={nav} currentUser={currentUser} openUserName={openUserName} />}
      {view === "profile"  && <FireFighterProfile firefighterId={profileId || currentUser?.id} onNavigate={nav} onUpdateUser={onUpdateUser} />}
      {view === "demandes" && <DemandesPage currentUser={currentUser} role="firefighter" onNavigate={nav} />}
      {view === "director" && <DirectorApprovalPage currentUser={currentUser} role="firefighter" onNavigate={nav} />}
    </RoleShell>
  );
}

function DDSView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView]               = useState("home");
  const [ddsId, setDdsId]             = useState(currentUser?.id || null);
  const [openUserId, setOpenUserId]     = useState(null);
  const [openUserName, setOpenUserName] = useState(null);

  const nav = (v, param = null) => {
    if (param && typeof param === 'object') {
      if (param.openUserId)   setOpenUserId(param.openUserId);
      if (param.openUserName) setOpenUserName(param.openUserName);
    } else {
      if (param) setDdsId(param);
      setOpenUserId(null);
      setOpenUserName(null);
    }
    setView(v);
  };

  return (
    <RoleShell role="manager" roleClass="role-manager" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
  {view === "home"          && <ManagerHome onNavigate={nav} currentUser={currentUser} />}
  {view === "garde"         && <ManagerGarde onNavigate={nav} currentUser={currentUser} />}
  {view === "messages"      && <ManagerMessage onNavigate={nav} currentUser={currentUser} openUserId={openUserId} openUserName={openUserName} />}
  {view === "notifications" && <ManagerNotifications onNavigate={nav} currentUser={currentUser} />}
  {view === "profile"       && <ManagerProfile ddsId={ddsId || currentUser?.id} currentUser={currentUser} onNavigate={nav} onUpdateUser={onUpdateUser} />}
  {view === "demandes"      && <DemandesPage currentUser={currentUser} role="manager" onNavigate={nav} />}
  {view === "director"      && <DirectorApprovalPage currentUser={currentUser} role="manager" onNavigate={nav} />}
     </RoleShell>
  );
}

// ── ROOT APP ─────────────────────────────────────────────────────
function App() {
  const [isLoggedIn, setIsLoggedIn]       = useState(false);
  const [currentUser, setCurrentUser]     = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
    if (token && user) {
      try { setIsLoggedIn(true); setCurrentUser(JSON.parse(user)); }
      catch { localStorage.removeItem("token"); localStorage.removeItem("user"); }
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    const enriched = { ...userData, displayName: userData.fullName || userData.nomPharmacie || userData.userId || userData.matricule || userData.email };
    setCurrentUser(enriched);
    localStorage.setItem("user", JSON.stringify(enriched));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setCurrentUser(null);
    window.location.href = "/";
  };

  const handleUpdateUser = (updatedFields) => {
    const updated = { ...currentUser, ...updatedFields };
    setCurrentUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  const getDashboard = () => {
    if (!currentUser) return <Navigate to="/" />;
    const LOCATION_ROLES = ['doctor', 'nurse', 'pharmacist', 'firefighter'];
    if (!currentUser.locationSet && LOCATION_ROLES.includes(currentUser.role)) {
      return (
        <LocationSetup
          currentUser={currentUser}
          onComplete={(data) => handleUpdateUser(data)}
        />
      );
    }
    const props = { currentUser, onLogout: handleLogout, onUpdateUser: handleUpdateUser };
    switch (currentUser.role) {
      case "admin":       return <AdminView {...props} />;
      case "doctor":      return <DoctorView {...props} />;
      case "nurse":       return <NurseView {...props} />;
      case "pharmacist":  return <PharmacistView {...props} />;
      case "firefighter": return <FirefighterView {...props} />;
      case "manager":     return <DDSView {...props} />;
      default:            return <div>Role not found</div>;
    }
  };

  if (isCheckingAuth) return <div style={{ padding: "50px", textAlign: "center", fontSize: "20px" }}>⏳ Loading...</div>;

  return (
    <Routes>
      <Route path="/signup"           element={!isLoggedIn ? <Signup onSignupSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />} />
      <Route path="/"                 element={!isLoggedIn ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard"        element={isLoggedIn ? getDashboard() : <Navigate to="/" />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="*"                 element={<Navigate to={isLoggedIn ? "/dashboard" : "/"} />} />
    </Routes>
  );
}

export default App;