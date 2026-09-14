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
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
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
      const [eventsSnap, donationsSnap, regsSnap, pmSnap, ccSnap] = await Promise.all([
        getDocs(collection(db, "events")),
        getDocs(collection(db, "donations")),
        getDocs(collection(db, "eventRegistrations")),
        getDocs(collection(db, "paymentMethods")),
        getDocs(collection(db, "costCenters"))
      ]);
      setSystemEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSystemDonations(donationsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSystemRegistrations(regsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPaymentMethods(pmSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCostCenters(ccSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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

  const handleSeed = async () => {
    if (!window.confirm("Seed data dummy SIMAYA ke database?")) return;
    setSaving(true);
    try {
      await seedSimayaDatabase();
      showMsg("success", "Data dummy SIMAYA berhasil dibuat!");
      await fetchAllData();
    } catch (e) {
      showMsg("error", "Gagal seed: " + e.message);
    } finally { setSaving(false); }
  };

  // --- STATUS ACTIONS ---
  const updateDocStatus = async (coll, id, status, extra = {}) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, coll, id), { status, ...extra, updatedAt: new Date().toISOString() });
      showMsg("success", "Status diperbarui!");
      await fetchAllData();
    } catch (e) {
      showMsg("error", "Gagal update status.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (coll, id) => {
    if (!window.confirm("Hapus data ini?")) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, coll, id));
      showMsg("success", "Data dihapus!");
      await fetchAllData();
    } catch (e) {
      showMsg("error", "Gagal menghapus.");
    } finally { setSaving(false); }
  };

  // --- EVENT FORM SAVE ---
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalType === "add") {
        await addDoc(collection(db, "events"), { ...editingItem, createdAt: new Date().toISOString() });
      } else {
        const c = { ...editingItem }; delete c.id;
        await setDoc(doc(db, "events", editingItem.id), { ...c, updatedAt: new Date().toISOString() });
      }
      setModalOpen(false);
      showMsg("success", "Kegiatan tersimpan!");
      await fetchAllData();
    } catch (err) {
      showMsg("error", "Gagal menyimpan kegiatan.");
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin fa-2x mb-3 text-warning"></i>
          <h4>Memuat SIMAYA...</h4>
        </div>
      </div>
    );
  }

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
            <button className="nav-link-cms" onClick={() => navigate("/admin/cms")}>
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
              <button onClick={handleSeed} disabled={saving} className="btn btn-sm btn-outline-warning" style={{ fontSize: "11px" }}>
                <i className="fas fa-seedling me-1"></i> Seed Data Dummy
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
            <>
              <div className="row g-3 mb-4">
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

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="cms-card">
                    <div className="cms-card-header">
                      <div className="cms-card-icon"><i className="fas fa-clock"></i></div>
                      <h5>Registrasi Menunggu ({stats.pendingRegs})</h5>
                    </div>
                    <div className="crud-list">
                      {systemRegistrations.filter(r => r.status === "pending").slice(0, 5).map(r => (
                        <div key={r.id} className="crud-item">
                          <div className="crud-info">
                            <span className="crud-title">{r.eventId || r.event || "-"}</span>
                            <div className="crud-meta">{r.userId || "-"}</div>
                          </div>
                          <div className="crud-actions">
                            <button className="btn-crud-edit" onClick={() => setActiveTab("registrations")}>Kelola</button>
                          </div>
                        </div>
                      ))}
                      {stats.pendingRegs === 0 && <p className="text-secondary p-2">Tidak ada antrian registrasi.</p>}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="cms-card">
                    <div className="cms-card-header">
                      <div className="cms-card-icon"><i className="fas fa-hand-holding-heart"></i></div>
                      <h5>Donasi Menunggu ({stats.pendingDon})</h5>
                    </div>
                    <div className="crud-list">
                      {systemDonations.filter(d => d.status === "pending").slice(0, 5).map(d => (
                        <div key={d.id} className="crud-item">
                          <div className="crud-info">
                            <span className="crud-title">Rp {Number(d.amount || 0).toLocaleString("id-ID")}</span>
                            <div className="crud-meta">{d.method || d.paymentMethod || "-"} · {d.userId || "-"}</div>
                          </div>
                          <div className="crud-actions">
                            <button className="btn-crud-edit" onClick={() => setActiveTab("donations")}>Verifikasi</button>
                          </div>
                        </div>
                      ))}
                      {stats.pendingDon === 0 && <p className="text-secondary p-2">Tidak ada antrian donasi.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "jamaah" && (
            <div className="cms-card">
              <div className="cms-card-header justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="cms-card-icon"><i className="fas fa-users"></i></div>
                  <div>
                    <h5>Daftar Jamaah</h5>
                    <small className="text-secondary">Total: {systemUsers.length} akun</small>
                  </div>
                </div>
              </div>
              <div className="simaya-table-wrapper">
                <table className="simaya-table">
                  <thead>
                    <tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    {systemUsers.map(u => {
                      const roleInfo = ROLES[u.role] || { label: u.role || "member", color: "#6b7280" };
                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600, color: "#fff" }}>{u.name || u.displayName || "-"}</td>
                          <td>{u.email}</td>
                          <td><span className="badge-cms" style={{ background: `${roleInfo.color}22`, color: roleInfo.color }}>{roleInfo.label}</span></td>
                          <td>
                            {u.status === "active"
                              ? <span className="badge-active">Aktif</span>
                              : <span className="badge-inactive">Nonaktif</span>}
                          </td>
                          <td>
                            <button className="btn-crud-edit" onClick={() => updateDocStatus("users", u.id, u.status === "active" ? "nonaktif" : "active")}>
                              {u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            <button className="btn-crud-delete" onClick={() => handleDelete("users", u.id)}><i className="fas fa-trash"></i></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {systemUsers.length === 0 && <p className="text-secondary p-3">Belum ada data jamaah. Klik <b>Seed Data Dummy</b> di atas.</p>}
              </div>
            </div>
          )}

          {activeTab === "kegiatan" && (
            <div className="cms-card">
              <div className="cms-card-header justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="cms-card-icon"><i className="fas fa-calendar-alt"></i></div>
                  <div>
                    <h5>Kegiatan SIMAYA</h5>
                    <small className="text-secondary">Total: {systemEvents.length} kegiatan</small>
                  </div>
                </div>
                <button onClick={() => { setEditingItem({ title: "", description: "", jadwal: "", status: "aktif", is_active: true }); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Kegiatan</button>
              </div>
              <div className="simaya-table-wrapper">
                <table className="simaya-table">
                  <thead>
                    <tr><th>Judul</th><th>Jadwal</th><th>Status</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    {systemEvents.map(e => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 600, color: "#fff" }}>{e.title}</td>
                        <td>{e.jadwal || e.startDate || "-"}</td>
                        <td>{e.is_active !== false ? <span className="badge-active">Aktif</span> : <span className="badge-inactive">Nonaktif</span>}</td>
                        <td>
                          <button className="btn-crud-edit" onClick={() => { setEditingItem(e); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                          <button className="btn-crud-delete" onClick={() => handleDelete("events", e.id)}><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {systemEvents.length === 0 && <p className="text-secondary p-3">Belum ada kegiatan. Klik <b>+ Tambah Kegiatan</b> atau <b>Seed Data Dummy</b>.</p>}
              </div>
            </div>
          )}

          {activeTab === "registrations" && (
            <div className="cms-card">
              <div className="cms-card-header justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="cms-card-icon"><i className="fas fa-clipboard-list"></i></div>
                  <div>
                    <h5>Registrasi Kegiatan</h5>
                    <small className="text-secondary">Total: {systemRegistrations.length} pendaftar · {stats.pendingRegs} pending</small>
                  </div>
                </div>
              </div>
              <div className="simaya-table-wrapper">
                <table className="simaya-table">
                  <thead>
                    <tr><th>Event</th><th>User</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    {systemRegistrations.map(r => (
                      <tr key={r.id}>
                        <td style={{ color: "#fff" }}>{r.event || r.eventId || "-"}</td>
                        <td>{r.userId || r.nama || "-"}</td>
                        <td>
                          {r.status === "approved" && <span className="badge-active">Disetujui</span>}
                          {r.status === "rejected" && <span className="badge-inactive">Ditolak</span>}
                          {(!r.status || r.status === "pending") && <span className="badge-pending">Pending</span>}
                        </td>
                        <td>{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString("id-ID") : (r.date || "-")}</td>
                        <td>
                          <button className="btn-crud-edit" onClick={() => updateDocStatus("eventRegistrations", r.id, "approved", { approvedAt: new Date().toISOString() })}>Setujui</button>
                          <button className="btn-crud-delete" onClick={() => updateDocStatus("eventRegistrations", r.id, "rejected")}>Tolak</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {systemRegistrations.length === 0 && <p className="text-secondary p-3">Belum ada pendaftaran.</p>}
              </div>
            </div>
          )}

          {activeTab === "donations" && (
            <div className="cms-card">
              <div className="cms-card-header justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="cms-card-icon"><i className="fas fa-hand-holding-heart"></i></div>
                  <div>
                    <h5>Donasi</h5>
                    <small className="text-secondary">Total: {systemDonations.length} donasi · {stats.pendingDon} pending</small>
                  </div>
                </div>
              </div>
              <div className="simaya-table-wrapper">
                <table className="simaya-table">
                  <thead>
                    <tr><th>Nominal</th><th>Metode</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    {systemDonations.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 700, color: "#e8c96e" }}>Rp {Number(d.amount || 0).toLocaleString("id-ID")}</td>
                        <td>{d.method || d.paymentMethod || "-"}</td>
                        <td>
                          {d.status === "verified" && <span className="badge-active">Terverifikasi</span>}
                          {d.status === "rejected" && <span className="badge-inactive">Ditolak</span>}
                          {(!d.status || d.status === "pending") && <span className="badge-pending">Pending</span>}
                        </td>
                        <td>{d.submittedAt ? new Date(d.submittedAt).toLocaleDateString("id-ID") : (d.date || "-")}</td>
                        <td>
                          <button className="btn-crud-edit" onClick={() => updateDocStatus("donations", d.id, "verified", { verifiedAt: new Date().toISOString() })}>Verifikasi</button>
                          <button className="btn-crud-delete" onClick={() => updateDocStatus("donations", d.id, "rejected")}>Tolak</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {systemDonations.length === 0 && <p className="text-secondary p-3">Belum ada donasi tercatat.</p>}
              </div>
            </div>
          )}

          {activeTab === "roles" && (
            <div className="cms-card">
              <div className="cms-card-header">
                <div className="cms-card-icon"><i className="fas fa-user-shield"></i></div>
                <div>
                  <h5>Role Manager</h5>
                  <small className="text-secondary">Kelola hak akses pengguna</small>
                </div>
              </div>
              <div style={{ padding: "20px" }}>
                <RoleManager />
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="cms-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="cms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal-header">
              <h5>{modalType === "add" ? "Tambah" : "Edit"} Kegiatan SIMAYA</h5>
              <button className="btn-close-custom" onClick={() => setModalOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSaveEvent}>
              <div className="cms-modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="cms-label">Judul Kegiatan *</label>
                    <input type="text" className="form-control cms-input" required value={editingItem?.title || ""} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="cms-label">Deskripsi</label>
                    <textarea className="form-control cms-input" rows="3" value={editingItem?.description || ""} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="cms-label">Jadwal</label>
                    <input type="text" className="form-control cms-input" value={editingItem?.jadwal || ""} onChange={(e) => setEditingItem({ ...editingItem, jadwal: e.target.value })} placeholder="cth: Setiap Rabu Malam" />
                  </div>
                  <div className="col-md-6">
                    <label className="cms-label">Tanggal Mulai</label>
                    <input type="date" className="form-control cms-input" value={editingItem?.startDate || ""} onChange={(e) => setEditingItem({ ...editingItem, startDate: e.target.value })} />
                  </div>
                  <div className="col-md-6 d-flex align-items-end">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" checked={editingItem?.is_active !== false} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} />
                      <label className="form-check-label text-white small">Aktif / Terbuka</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="cms-modal-footer">
                <button type="button" className="btn-cms-cancel" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" disabled={saving} className="btn-cms-save">{saving ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
