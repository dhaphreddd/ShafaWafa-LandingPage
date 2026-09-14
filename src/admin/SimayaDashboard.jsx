import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getAllUsers, ROLES } from "../utils/roleHelper";
import RoleManager from "./RoleManager";
import { getAllEvents, getAllDonations, getLiveCollection } from "../firebase";
import { SYSTEM_COLLECTIONS } from "../firebase";
import { formatImageUrl } from "../utils/imageHelper";
import "../styles/admin-styles.css";

export default function SimayaDashboard() {
  const [activeTab, setActiveTab] = useState("events");
  const [systemUsers, setSystemUsers] = useState([]);
  const [systemEvents, setSystemEvents] = useState([]);
  const [systemRegistrations, setSystemRegistrations] = useState([]);
  const [systemDonations, setSystemDonations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/admin");
      else loadData();
    });
    return unsub;
  }, [navigate]);

  const loadData = async () => {
    setSystemUsers(await getAllUsers());
    setSystemEvents(await getAllEvents());
    setSystemRegistrations(await getLiveCollection(SYSTEM_COLLECTIONS.REGISTRATIONS));
    setSystemDonations(await getAllDonations());
  };

  return (
    <div className="admin-body">
      <div className="sidebar">
        <div className="sidebar-header">
           <img src={formatImageUrl("logo-sm.webp")} className="logo-icon" alt="Logo" />
           <span className="logo-text">SIMAYA ADMIN</span>
        </div>
        <div className="nav-menu">
           <div className="nav-item">
             <button className={`nav-link-cms ${activeTab === "events" ? "active" : ""}`} onClick={() => setActiveTab("events")}>
               <i className="fas fa-calendar-alt"></i><span className="nav-text">Kegiatan SIMAYA</span>
             </button>
           </div>
           <div className="nav-item">
             <button className={`nav-link-cms ${activeTab === "registrations" ? "active" : ""}`} onClick={() => setActiveTab("registrations")}>
               <i className="fas fa-clipboard-list"></i><span className="nav-text">Registrasi</span>
             </button>
           </div>
           <div className="nav-item">
             <button className={`nav-link-cms ${activeTab === "donations" ? "active" : ""}`} onClick={() => setActiveTab("donations")}>
               <i className="fas fa-hand-holding-heart"></i><span className="nav-text">Donasi</span>
             </button>
           </div>
           <div className="nav-item">
             <button className={`nav-link-cms ${activeTab === "roles" ? "active" : ""}`} onClick={() => setActiveTab("roles")}>
               <i className="fas fa-user-shield"></i><span className="nav-text">Role Manager</span>
             </button>
           </div>
           <div className="nav-item mt-4 border-t border-white/10 pt-2">
             <button className="nav-link-cms text-warning" onClick={() => navigate("/admin/cms")}>
                <i className="fas fa-globe"></i> CMS Landing
             </button>
           </div>
        </div>
      </div>
      <div className="main-content p-6 text-white">
         <h1 className="text-2xl font-bold mb-4">SIMAYA: {activeTab.toUpperCase()}</h1>
         {activeTab === "events" && <div>Kegiatan SIMAYA: {systemEvents.length} events</div>}
         {activeTab === "registrations" && <div>Registrasi: {systemRegistrations.length} entri</div>}
         {activeTab === "donations" && <div>Donasi: {systemDonations.length} entri</div>}
         {activeTab === "roles" && <RoleManager />}
      </div>
    </div>
  );
}