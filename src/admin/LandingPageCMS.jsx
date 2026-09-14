import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  db,
  storage,
  isFirebaseConfigured,
  seedFirestoreDatabase,
  getSiteSettings,
  getCollectionData
} from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { formatImageUrl } from "../utils/imageHelper";
import "../styles/admin-styles.css";

const CMS_TABS = [
  { key: "hero", label: "Hero", icon: "fas fa-home" },
  { key: "tentang", label: "Tentang Kami", icon: "fas fa-info-circle" },
  { key: "profil", label: "Profil & Sejarah", icon: "fas fa-user-tie" },
  { key: "struktur", label: "Struktur", icon: "fas fa-sitemap" },
  { key: "visi", label: "Visi & Misi", icon: "fas fa-bullseye" },
  { key: "kegiatan", label: "Kegiatan", icon: "fas fa-calendar-alt" },
  { key: "artikel", label: "Artikel", icon: "fas fa-newspaper" },
  { key: "galeri", label: "Galeri Foto", icon: "fas fa-images" },
  { key: "video", label: "Galeri Video", icon: "fas fa-video" },
  { key: "nilai", label: "Nilai Yayasan", icon: "fas fa-star" },
  { key: "lokasi", label: "Lokasi & Sosial", icon: "fas fa-map-marker-alt" },
];

const collectionMap = {
  hero: "heroStats",
  nilai: "nilais",
  visi: "misis",
  tentang: "tentangFeatures",
  profil: "sejarahs",
  struktur: "strukturs",
  kegiatan: "kegiatans",
  artikel: "artikels",
  galeri: "galeriEvents",
  video: "videos",
  lokasi: "sosials"
};

export default function LandingPageCMS() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState([]);
  const [nilais, setNilais] = useState([]);
  const [misis, setMisis] = useState([]);
  const [features, setFeatures] = useState([]);
  const [sejarahs, setSejarahs] = useState([]);
  const [strukturs, setStrukturs] = useState([]);
  const [kegiatans, setKegiatans] = useState([]);
  const [artikels, setArtikels] = useState([]);
  const [galeriEvents, setGaleriEvents] = useState([]);
  const [videos, setVideos] = useState([]);
  const [sosials, setSosials] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth) { navigate("/admin"); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); loadAllData(); }
      else navigate("/admin");
    });
    return unsub;
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      setSettings(await getSiteSettings());
      setStats(await getCollectionData("heroStats", "landing_hero_stats"));
      setNilais(await getCollectionData("nilais", "landing_nilais"));
      setMisis(await getCollectionData("misis", "landing_misis"));
      setFeatures(await getCollectionData("tentangFeatures", "landing_tentang_features"));
      setSejarahs(await getCollectionData("sejarahs", "landing_sejarahs"));
      setStrukturs(await getCollectionData("strukturs", "landing_strukturs"));
      setKegiatans(await getCollectionData("kegiatans", "landing_kegiatans"));
      setArtikels(await getCollectionData("artikels", "landing_artikels"));
      setGaleriEvents(await getCollectionData("galeriEvents", "landing_galeri_events"));
      setVideos(await getCollectionData("videos", "landing_videos"));
      setSosials(await getCollectionData("sosials", "landing_sosials"));
    } catch (e) {
      showMsg("error", "Gagal memuat data CMS.");
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

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "site_config"), settings);
      showMsg("success", "Pengaturan tersimpan!");
    } catch (e) {
      showMsg("error", "Gagal menyimpan.");
    } finally { setSaving(false); }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    const collName = collectionMap[activeTab];
    try {
      if (modalType === "add") {
        await addDoc(collection(db, collName), editingItem);
      } else {
        const c = { ...editingItem }; delete c.id;
        await setDoc(doc(db, collName, editingItem.id), c);
      }
      setModalOpen(false);
      showMsg("success", "Data tersimpan!");
      await loadAllData();
    } catch (e) {
      showMsg("error", "Gagal menyimpan data.");
    } finally { setSaving(false); }
  };

  const handleDeleteItem = async (id, collName) => {
    if (!window.confirm("Hapus data ini?")) return;
    try {
      await deleteDoc(doc(db, collName, id));
      showMsg("success", "Data dihapus!");
      await loadAllData();
    } catch (e) { showMsg("error", "Gagal menghapus."); }
  };

  const currentItems = () => {
    switch (activeTab) {
      case "hero": return { data: stats, coll: "heroStats" };
      case "nilai": return { data: nilais, coll: "nilais" };
      case "visi": return { data: misis, coll: "misis" };
      case "tentang": return { data: features, coll: "tentangFeatures" };
      case "profil": return { data: sejarahs, coll: "sejarahs" };
      case "struktur": return { data: strukturs, coll: "strukturs" };
      case "kegiatan": return { data: kegiatans, coll: "kegiatans" };
      case "artikel": return { data: artikels, coll: "artikels" };
      case "galeri": return { data: galeriEvents, coll: "galeriEvents" };
      case "video": return { data: videos, coll: "videos" };
      case "lokasi": return { data: sosials, coll: "sosials" };
      default: return { data: [], coll: "" };
    }
  };

  const itemTitle = (item) => {
    return item.title || item.judul || item.value || item.jabatan || item.platform || item.misi_text || item.tahun || "-";
  };

  const handleImageUpload = (file, callback) => {
    const storageRef = ref(storage, `cms/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on("state_changed", null,
      (err) => showMsg("error", "Upload gagal."),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        callback(url);
        showMsg("success", "Gambar terunggah!");
      });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin fa-2x mb-3 text-warning"></i>
          <h4>Memuat CMS Landing Page...</h4>
        </div>
      </div>
    );
  }

  const { data: items, coll: collName } = currentItems();

  return (
    <div className="admin-body">
      <div className="sidebar">
        <div className="sidebar-header">
          <img src={formatImageUrl("logo-sm.webp")} className="logo-icon" alt="Logo" />
          <span className="logo-text">LANDING CMS</span>
        </div>
        <div className="nav-menu">
          {CMS_TABS.map(t => (
            <div className="nav-item" key={t.key}>
              <button className={`nav-link-cms ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
                <i className={t.icon}></i><span className="nav-text">{t.label}</span>
              </button>
            </div>
          ))}
          <div className="nav-item mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button className="nav-link-cms" onClick={() => navigate("/admin/simaya")}>
              <i className="fas fa-database"></i><span className="nav-text">Sistem SIMAYA</span>
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="top-header">
          <div>
            <h4 className="m-0 text-white fw-bold d-flex align-items-center gap-2" style={{ fontSize: "18px" }}>
              <i className="fas fa-globe text-warning"></i> CMS Landing Page
            </h4>
            <div className="mt-1">
              <span className="text-secondary small" style={{ fontSize: "12px" }}>
                <i className="far fa-user me-1 text-warning"></i> {user?.email || "Admin"}
              </span>
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

          <div className="cms-card">
            <div className="cms-card-header justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div className="cms-card-icon"><i className="fas fa-list"></i></div>
                <div>
                  <h5>Konten: {CMS_TABS.find(t => t.key === activeTab)?.label}</h5>
                  <small className="text-secondary">Total: {items.length} item</small>
                </div>
              </div>
              <button type="button" onClick={() => { setEditingItem({ is_active: true, urutan: items.length + 1 }); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah</button>
            </div>

            <div className="crud-list">
              {items.length === 0 && <p className="text-secondary p-3">Belum ada data pada section ini.</p>}
              {items.map(item => (
                <div key={item.id} className="crud-item">
                  <div className="crud-thumb kc-1">
                    {item.image_path || item.gambar_path
                      ? <img src={formatImageUrl(item.image_path || item.gambar_path)} alt="" referrerPolicy="no-referrer" />
                      : <i className={item.icon || "fas fa-file-alt"}></i>}
                  </div>
                  <div className="crud-info">
                    <span className="crud-title">{itemTitle(item)}</span>
                    <div className="crud-meta">
                      {(item.desc || item.deskripsi || item.excerpt || item.label || "") + ""}
                    </div>
                  </div>
                  <div className="crud-actions">
                    <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                    <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, collName)}><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="cms-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="cms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal-header">
              <h5>{modalType === "add" ? "Tambah" : "Edit"} — {CMS_TABS.find(t => t.key === activeTab)?.label}</h5>
              <button className="btn-close-custom" onClick={() => setModalOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="cms-modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="cms-label">Data JSON (edit langsung)</label>
                    <textarea
                      className="form-control cms-input"
                      rows="14"
                      style={{ fontFamily: "monospace", fontSize: "12px" }}
                      value={JSON.stringify(editingItem, null, 2)}
                      onChange={(e) => { try { setEditingItem(JSON.parse(e.target.value)); } catch {} }}
                    />
                    <small className="text-secondary">Tip: tambah field title/desc/judul/konten/image_path sesuai section. Untuk gambar, upload dulu via tombol di bawah lalu paste URL-nya.</small>
                  </div>
                  <div className="col-12">
                    <label className="cms-label">Upload Gambar Baru</label>
                    <input type="file" accept="image/*" className="form-control cms-input" onChange={(e) => {
                      if (e.target.files[0]) handleImageUpload(e.target.files[0], (url) => setEditingItem({ ...editingItem, image_path: url, gambar_path: url }));
                    }} />
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

      <form onSubmit={saveSettings} className="d-none">
        <button type="submit" id="hidden-settings-save" />
      </form>
    </div>
  );
}
