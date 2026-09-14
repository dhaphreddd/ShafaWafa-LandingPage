import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { formatImageUrl } from "../utils/imageHelper";
import { getAllUsers, ROLES } from "../utils/roleHelper";
import RoleManager from "./RoleManager";
import "../styles/admin-styles.css";

// Dummy initial data for testing - will be overridden by DB fetch
const DUMMY_EVENTS = [
  { id: "1", title: "Majelis Reboan Agung", jadwal: "Setiap Rabu", status: "aktif", is_active: true },
  { id: "2", title: "Istighasah As-Shafa", jadwal: "Jumat Wage", status: "aktif", is_active: true },
  { id: "3", title: "Peringatan Maulid", jadwal: "Bulan Maulid", status: "aktif", is_active: true }
];
const DUMMY_DONATIONS = [
  { id: "1", amount: "250000", method: "Bank BCA", status: "verified", date: "2024-01-15" },
  { id: "2", amount: "100000", method: "QRIS", status: "pending", date: "2024-01-16" }
];
const DUMMY_REGISTRATIONS = [
  { id: "1", event: "Majelis Reboan", user: "Jamaah A", status: "approved", date: "2024-01-10" }
];

export default function SimayaDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]);
  const [systemEvents, setSystemEvents] = useState([]);
  const [systemRegistrations, setSystemRegistrations] = useState([]);
  const [systemDonations, setSystemDonations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/admin");
      else { setUser(u); fetchAllData(); }
    });
    return unsub;
  }, [navigate]);

  const fetchAllData = async () => {
    try {
      // Fetch users + events + donations + registrations + configs
      const [usersSnap, eventsSnap, donationsSnap, registrationsSnap] = await Promise.all([
        getAllUsers(),
        getDocs(collection(db, "events")),
        getDocs(collection(db, "donations")),
        getDocs(collection(db, "eventRegistrations"))
      ]);
      setSystemUsers(usersSnap.map(s => ({ id: s.id, ...s.data() })));
      setSystemEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSystemDonations(donationsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSystemRegistrations(registrationsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Gagal fetch data:", e);
    }
  };

  // --- STATS DASHBOARD ---
  const statsFromData = () => {
    const activeUsers = systemUsers.filter(u => u.status !== "nonaktif").length;
    const totalEvents = systemEvents.length;
    const totalDonations = systemDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const pendingRegistrations = systemRegistrations.filter(r => r.status === "pending").length;
    return {
      users: activeUsers,
      events: totalEvents,
      donations: totalDonations,
      pendingRegistrations
    };
  };

  // --- NAVIGATION ---
  const tabContents = {
    dashboard: (
      <div className="space-y-4">
        <div className="row">
          <div className="col-6 col-sm-3">
            <div className="bg-green-dark/60 border border-gold/20 rounded-xl p-4 text-center">
              <div className="fs-1 text-gold">{statsFromData().users}</div>
              <div className="text-xs text-gray-300">Jamaah Aktif</div>
            </div>
          </div>
          <div className="col-6 col-sm-3">
            <div className="bg-green-dark/60 border border-gold/20 rounded-xl p-4 text-center">
              <div className="fs-1 text-gold">{statsFromData().events}</div>
              <div className="text-xs text-gray-300">Kegiatan SIMAYA</div>
            </div>
          </div>
          <div className="col-6 col-sm-3">
            <div className="bg-green-dark/60 border border-gold/20 rounded-xl p-4 text-center">
              <div className="fs-1 text-gold">Rp {statsFromData().donations.toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-300">Total Donasi</div>
            </div>
          </div>
          <div className="col-6 col-sm-3">
            <div className="bg-green-dark/60 border border-gold/20 rounded-xl p-4 text-center">
              <div className="fs-1 text-yellow-400">{statsFromData().pendingRegistrations}</div>
              <div className="text-xs text-gray-300">Registrasi Menunggu</div>
            </div>
          </div>
        </div>
      </div>
    ),
    jamaah: (
      <div className="p-4">
        <h4 className="text-uppercase small text-gray-300 mb-3">Daftar Jamaah</h4>
        <div className="bg-green-dark/60 border border-gold/20 rounded-xl p-4">
          {systemUsers.length === 0 ? <p className="text-gray-300">Belum ada data jamaah.</p> : (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {systemUsers.map(u => (
                  <tr key={u.id} style={{ background: u.status === "nonaktif" ? "#fee2e2" : "#ffffff" }}>
                    <td>{u.name || "-"}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${ROLES[u.role]?.color || "#6b7280"}`}>
                        {ROLES[u.role]?.label || u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${u.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {u.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
<td>
                       <button className="btn btn-sm btn-outline-primary">Edit</button>
                       <button className="btn btn-sm btn-outline-danger">Hapus</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
       </div>
     ),
     kegiatan: (
       <div className="p-4">
         <h4 className="text-uppercase small text-gray-300 mb-3">Kegiatan SIMAYA</h4>
         <div className="bg-green-dark/60 border border-gold/20 rounded-xl p-4">
           {systemEvents.length === 0 ? <p className="text-gray-300">Belum ada kegiatan terdaftar.</p> : (
             <table className="table table-bordered">
               <thead>
                 <tr>
                   <th>Judul</th>
                   <th>Jadwal</th>
                   <th>Status</th>
                   <th>Aksi</th>
                 </tr>
               </thead>
               <tbody>
                 {systemEvents.map(e => (
                   <tr key={e.id} style={{ background: e.is_active === false ? "#fee2e2" : "#ffffff" }}>
                     <td>{e.title}</td>
                     <td>{e.jadwal}</td>
                     <td>
                       <span className={`px-2 py-1 rounded text-xs ${e.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                         {e.is_active ? "Aktif" : "Nonaktif"}
                       </span>
                     </td>
                     <td>
                       <button className="btn btn-sm btn-outline-primary">Edit</button>
                       <button className="btn btn-sm btn-outline-danger">Hapus</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
       </div>
     ),
    registrasi: (
      <div className="p-4">
        <h4 className="text-uppercase small text-gray-300 mb-3">Daftar Registrasi</h4>
        <div className="bg-green-dark/60 border border-gold/20 rounded-xl p-4">
          {systemRegistrations.length === 0 ? <p className="text-gray-300">Belum ada pendaftaran.</p> : (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {systemRegistrations.map(r => (
                  <tr key={r.id} style={{ background: r.status === "rejected" ? "#fee2e2" : "#ffffff" }}>
                    <td>{r.event || "-"} (${r.eventId || "-"})</td>
                    <td>{r.userId ? "User " + r.userId : "Tidak diketahui"}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${r.status === "approved" ? "bg-green-100 text-green-800" : r.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString('id-ID') : "-"}</td>
<td>
                       <button className="btn btn-sm btn-outline-primary">Detail</button>
                       <button className="btn btn-sm btn-outline-success" onClick={() => approveRegistration(r.id)}>Setujui</button>
                       <button className="btn btn-sm btn-outline-danger" onClick={() => rejectRegistration(r.id)}> Tolak</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
       </div>
     ),
     donasi: (
       <div className="p-4">
         <h4 className="text-uppercase small text-gray-300 mb-3">Daftar Donasi</h4>
        <div className="bg-green-dark/60 border border-gold/20 rounded-xl p-4">
          {systemDonations.length === 0 ? <p className="text-gray-300">Belum ada donasi tercatat.</p> : (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Metode</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {systemDonations.map(d => (
                  <tr key={d.id} style={{ background: d.status === "rejected" ? "#fee2e2" : "#ffffff" }}>
                    <td>Rp {Number(d.amount || 0).toLocaleString('id-ID')}</td>
                    <td>{d.method || "-"}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${d.status === "verified" ? "bg-green-100 text-green-800" : d.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>{new Date(d.date).toLocaleDateString('id-ID')}</td>
<td>
                       <button className="btn btn-sm btn-outline-primary">Detail</button>
                       <button className="btn btn-sm btn-outline-success" onClick={() => verifyDonation(d.id)}>Setujui</button>
                       <button className="btn btn-sm btn-outline-danger" onClick={() => rejectDonation(d.id)}> Tolak</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
       </div>
     ),
     role: (
       <div className="p-4">
         <h4 className="text-uppercase small text-gray-300 mb-3">Role Manager</h4>
         <p className="text-sm text-gray-400 mb-3">Kelola role dan hak akses pengguna</p>
         <RoleManager />
       </div>
     )
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
            <button className={`nav-link-cms ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
              <i className="fas fa-tachometer-alt"></i><span className="nav-text">Dashboard</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "jamaah" ? "active" : ""}`} onClick={() => setActiveTab("jamaah")}>
              <i className="fas fa-users"></i><span className="nav-text">Jamaah</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "kegiatan" ? "active" : ""}`} onClick={() => setActiveTab("kegiatan")}>
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
          <div className="nav-item mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button className="nav-link-cms text-warning" onClick={() => navigate("/admin/cms")}>
               <i className="fas fa-globe"></i> CMS Landing
            </button>
          </div>
        </div>
      </div>
      <div className="main-content p-6 text-white">
        {tabContents[activeTab]}
      </div>
    </div>
  );
}

// Helper functions for admin actions
export function approveRegistration(regId) {
  // Implement approval logic
  alert("Registrasi disetujui!");
}

export function rejectRegistration(regId) {
  alert("Registrasi ditolak!");
}

export function verifyDonation(donId) {
  alert("Donasi diverifikasi!");
}

export function rejectDonation(donId) {
  alert("Donasi ditolak!");
}