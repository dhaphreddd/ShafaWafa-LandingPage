import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, seedSimayaDatabase } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { formatImageUrl } from "../utils/imageHelper";
import { getAllUsers, ROLES } from "../utils/roleHelper";
import RoleManager from "./RoleManager";
import "../styles/admin-styles.css";

const SIMAYA_TABS = [
  { key: "dashboard", label: "Dashboard", icon: "fas fa-tachometer-alt" },
  { key: "jamaah", label: "Jamaah", icon: "fas fa-users" },
  { key: "kegiatan", label: "Kegiatan SIMAYA", icon: "fas fa-calendar-alt" },
  { key: "registrations", label: "Registrasi", icon: "fas fa-clipboard-list" },
  { key: "donations", label: "Donasi", icon: "fas fa-hand-holding-heart" },
  { key: "roles", label: "Role Manager", icon: "fas fa-user-shield" },
];

export default function SimayaDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [systemUsers, setSystemUsers] = useState([]);
  const [systemEvents, setSystemEvents] = useState([]);
  const [systemRegistrations, setSystemRegistrations] = useState([]);
  const [systemDonations, setSystemDonations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth) { navigate("/admin"); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); fetchAllData(); }
      else navigate("/admin");
    });
    return unsub;
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      setSystemUsers(users);
      const [eventsSnap, donationsSnap, regsSnap] = await Promise.all([
        getDocs(collection(db, "events")),
        getDocs(collection(db, "donations")),
        getDocs(collection(db, "eventRegistrations"))
      ]);
      setSystemEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSystemDonations(donationsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSystemRegistrations(regsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Gagal fetch data:", e);
      showMsg("error", "Gagal memuat data SIMAYA.");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin");
  };

  const setSuperAdmin = async () => {
    setSaving(true);
    try {
      const superAdminId = "superadmin_admin_gmail";
      await setDoc(doc(db, "users", superAdminId), {
        name: "Super Administrator",
        email: "admin@gmail.com",
        role: "superadmin",
        status: "active",
        permissions: ["*"],
        createdAt: new Date().toISOString()
      });
      showMsg("success", "admin@gmail.com diset sebagai superadmin!");
      await fetchAllData();
    } catch (e) {
      showMsg("error", "Gagal: " + e.message);
    } finally { setSaving(false); }
  };

  const stats = {
    users: systemUsers.filter(u => u.status !== "nonaktif").length,
    events: systemEvents.length,
    donations: systemDonations.reduce((s, d) => s + Number(d.amount || 0), 0),
    pendingRegs: systemRegistrations.filter(r => r.status === "pending").length,
    pendingDon: systemDonations.filter(d => d.status === "pending").length
  };

  const statCards = [
    { icon: "fas fa-users", value: stats.users, label: "Jamaah", color: "#48cae4" },
    { icon: "fas fa-calendar-alt", value: stats.events, label: "Kegiatan", color: "#64ffda" },
    { icon: "fas fa-hand-holding-heart", value: `Rp ${stats.donations.toLocaleString("id-ID")}`, label: "Total Donasi", color: "#e8c96e" },
    { icon: "fas fa-clock", value: stats.pendingRegs + stats.pendingDon, label: "Menunggu Verifikasi", color: "#f59e0b" },
  ];

  return (
    <div className="admin-body">
      <div className="sidebar">
        <div className="sidebar-header">
          <img src={formatImageUrl("logo-sm.webp")} className="logo-icon" alt="Logo" />
          <span className="logo-text">SIMAYA ADMIN</span>
        </div>
        <div className="nav-menu">
          {SIMAYA_TABS.map(t => (
            <div className="nav-item" key={t.key}>
              <button className={`nav-link-cms ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
                <i className={t.icon}></i><span className="nav-text">{t.label}</span>
              </button>
            </div>
          ))}
          <div className="nav-item mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button className="nav-link-cms text-warning" onClick={() => navigate("/admin/cms")}>
               <i className="fas fa-globe"></i><span className="nav-text">CMS Landing</span>
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="top-header">
          <div>
            <h4 className="m-0 text-white fw-bold d-flex align-items-center gap-2" style={{ fontSize: "18px" }}>
              <i className="fas fa-database text-warning"></i> Sistem Manajemen Yayasan
            </h4>
            <div className="mt-1 d-flex align-items-center gap-2">
              <span className="text-secondary small" style={{ fontSize: "12px" }}>
                <i className="far fa-user me-1 text-warning"></i> {user?.email || "Admin"}
              </span>
              <button onClick={setSuperAdmin} disabled={saving} className="btn btn-sm btn-outline-warning" style={{ fontSize: "11px" }}>
                <i className="fas fa-crown me-1"></i> Set admin@gmail.com Superadmin
              </button>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-danger px-3 py-2" style={{ borderRadius: "50px", background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", fontSize: "12px", fontWeight: 600 }}>
            <i className="fas fa-sign-out-alt me-1"></i> Keluar
          </button>
        </div>

        <div className="container-fluid py-4" style={{ paddingLeft: "30px", paddingRight: "30px" }}>
          {message.text && (
            <div className={`alert alert-${message.type === "success" ? "success" : "danger"} alert-dismissible fade show`} role="alert">
              {message.text}
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="row g-3">
                {statCards.map((s, i) => (
                  <div className="col-6 col-lg-3" key={i}>
                    <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
                      <div style={{ width: "52px", height: "52px", borderRadius: "14px", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", background: `${s.color}1f`, border: `1px solid ${s.color}44` }}>
                        <i className={s.icon} style={{ color: s.color, fontSize: "20px" }}></i>
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>{s.value}</div>
                      <small className="text-secondary">{s.label}</small>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === "roles" && <RoleManager />}
          {activeTab !== "dashboard" && activeTab !== "roles" && (
            <div className="cms-card p-4 text-center text-secondary">
               <p>Modul {activeTab} sedang dalam pengembangan. Silakan gunakan data di Firebase Firestore.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}