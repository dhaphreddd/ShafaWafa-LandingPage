import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, getAllEvents, getAllDonations, getLiveCollection, SYSTEM_COLLECTIONS } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { formatImageUrl } from "../utils/imageHelper";
import RoleManager from "./RoleManager";
import "../styles/admin-styles.css";

export default function SimayaDashboard() {
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [donations, setDonations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (!u) navigate("/admin"); });
    loadData();
    return unsub;
  }, [navigate]);

  const loadData = async () => {
    setEvents(await getAllEvents());
    setRegistrations(await getLiveCollection(SYSTEM_COLLECTIONS.REGISTRATIONS));
    setDonations(await getAllDonations());
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
               <i className="fas fa-calendar"></i><span className="nav-text">Kegiatan SIMAYA</span>
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
                <i className="fas fa-globe"></i> Kelola CMS Landing
             </button>
           </div>
        </div>
      </div>
      <div className="main-content p-6 text-white">
         <h1 className="text-2xl font-bold mb-4">Sistem Manajemen Yayasan (SIMAYA): {activeTab.toUpperCase()}</h1>
         {activeTab === "roles" && <RoleManager />}
         {activeTab === "events" && <div>Total Kegiatan: {events.length}</div>}
         {activeTab === "registrations" && <div>Total Pendaftar: {registrations.length}</div>}
         {activeTab === "donations" && <div>Total Donasi: {donations.length}</div>}
      </div>
    </div>
  );
}
