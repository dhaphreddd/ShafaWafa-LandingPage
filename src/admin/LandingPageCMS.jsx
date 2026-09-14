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

  // Render form inputs based on active tab
  const renderFormInputs = () => {
    if (!editingItem) return null;
    switch (activeTab) {
      case "hero": // Stats
        return (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="cms-label">Angka / Nilai</label>
              <input type="text" className="form-control cms-input" required value={editingItem.value || ""} onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })} placeholder="cth: 2002 atau 1000+" />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Keterangan / Label</label>
              <input type="text" className="form-control cms-input" required value={editingItem.label || ""} onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })} placeholder="cth: Tahun Berdiri" />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Icon FontAwesome</label>
              <input type="text" className="form-control cms-input" value={editingItem.icon || "fas fa-chart-bar"} onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })} placeholder="fas fa-chart-bar" />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Urutan</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
          </div>
        );
      case "nilai":
        return (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="cms-label">Judul Nilai</label>
              <input type="text" className="form-control cms-input" required value={editingItem.title || ""} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} placeholder="cth: Keikhlasan" />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Icon FontAwesome</label>
              <input type="text" className="form-control cms-input" value={editingItem.icon || "fas fa-star"} onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })} placeholder="fas fa-leaf" />
            </div>
            <div className="col-12">
              <label className="cms-label">Deskripsi</label>
              <textarea className="form-control cms-input" rows="3" required value={editingItem.desc || ""} onChange={(e) => setEditingItem({ ...editingItem, desc: e.target.value })} placeholder="Penjelasan nilai..."></textarea>
            </div>
            <div className="col-md-6">
              <label className="cms-label">Urutan</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
          </div>
        );
      case "tentang": // features
        return (
          <div className="row g-3">
            <div className="col-md-8">
              <label className="cms-label">Judul</label>
              <input type="text" className="form-control cms-input" required value={editingItem.title || ""} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} placeholder="cth: Kedalaman Spiritual" />
            </div>
            <div className="col-md-4">
              <label className="cms-label">Icon FontAwesome</label>
              <input type="text" className="form-control cms-input" value={editingItem.icon || "fas fa-heart"} onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })} placeholder="fas fa-heart" />
            </div>
            <div className="col-12">
              <label className="cms-label">Deskripsi</label>
              <textarea className="form-control cms-input" rows="3" required value={editingItem.desc || ""} onChange={(e) => setEditingItem({ ...editingItem, desc: e.target.value })} placeholder="Deskripsi singkat..."></textarea>
            </div>
            <div className="col-md-6">
              <label className="cms-label">Urutan</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
          </div>
        );
      case "profil": // sejarahs
        return (
          <div className="row g-3">
            <div className="col-md-4">
              <label className="cms-label">Tahun</label>
              <input type="text" className="form-control cms-input" required value={editingItem.tahun || ""} onChange={(e) => setEditingItem({ ...editingItem, tahun: e.target.value })} placeholder="cth: 2002" />
            </div>
            <div className="col-md-8">
              <label className="cms-label">Judul Peristiwa</label>
              <input type="text" className="form-control cms-input" required value={editingItem.judul || ""} onChange={(e) => setEditingItem({ ...editingItem, judul: e.target.value })} placeholder="cth: Awal Mula Pengajian" />
            </div>
            <div className="col-12">
              <label className="cms-label">Deskripsi Sejarah</label>
              <textarea className="form-control cms-input" rows="3" required value={editingItem.deskripsi || ""} onChange={(e) => setEditingItem({ ...editingItem, deskripsi: e.target.value })} placeholder="Ceritakan peristiwa..."></textarea>
            </div>
            <div className="col-md-6">
              <label className="cms-label">Urutan</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
          </div>
        );
      case "visi":
        return (
          <div className="row g-3">
            <div className="col-12">
              <label className="cms-label">Teks Misi</label>
              <textarea className="form-control cms-input" rows="3" required value={editingItem.misi_text || ""} onChange={(e) => setEditingItem({ ...editingItem, misi_text: e.target.value })} placeholder="Masukkan butir misi..."></textarea>
            </div>
            <div className="col-md-6">
              <label className="cms-label">Urutan</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
          </div>
        );
      case "struktur":
        return (
          <div className="row g-3">
            <div className="col-md-8">
              <label className="cms-label">Jabatan *</label>
              <input type="text" className="form-control cms-input" required value={editingItem.jabatan || ""} onChange={(e) => setEditingItem({ ...editingItem, jabatan: e.target.value })} placeholder="cth: Pembina Utama" />
            </div>
            <div className="col-md-4">
              <label className="cms-label">Level Chart (1 - 5)</label>
              <input type="number" min="0" max="5" className="form-control cms-input" value={editingItem.level || 1} onChange={(e) => setEditingItem({ ...editingItem, level: parseInt(e.target.value) })} />
            </div>
            <div className="col-md-8">
              <label className="cms-label">Nama</label>
              <input type="text" className="form-control cms-input" value={editingItem.nama || ""} onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })} placeholder="Nama Lengkap Pengurus" />
            </div>
            <div className="col-md-4">
              <label className="cms-label">Tipe Organisasi</label>
              <select className="form-select cms-input" value={editingItem.tipe || "department"} onChange={(e) => setEditingItem({ ...editingItem, tipe: e.target.value })}>
                <option value="leader">Leader (Pembina)</option>
                <option value="chairman">Chairman (Ketua)</option>
                <option value="staff">Staff (Pengurus)</option>
                <option value="department">Department (Divisi)</option>
              </select>
            </div>
            <div className="col-12">
              <label className="cms-label">Keterangan / Deskripsi</label>
              <input type="text" className="form-control cms-input" value={editingItem.deskripsi || ""} onChange={(e) => setEditingItem({ ...editingItem, deskripsi: e.target.value })} placeholder="cth: Mengawasi program kepesantrenan" />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Urutan</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="strActive" checked={editingItem.is_active !== false} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} />
                <label className="form-check-label text-white small" htmlFor="strActive">Tampilkan di Halaman</label>
              </div>
            </div>
          </div>
        );
      case "kegiatan":
        return (
          <div className="row g-3">
            <div className="col-12">
              <label className="cms-label">Upload Gambar Baru</label>
              <div className="cms-upload-placeholder" onClick={() => document.getElementById("file-kegiatan").click()}>
                <i className="fas fa-cloud-upload-alt" style={{ fontSize: "28px" }}></i>
                <span>Klik untuk Unggah Gambar</span>
                <small>Format: JPG, PNG, WebP</small>
              </div>
              <input type="file" id="file-kegiatan" accept="image/*" className="d-none" onChange={(e) => {
                if (e.target.files[0]) handleImageUpload(e.target.files[0], (url) => setEditingItem({ ...editingItem, image_path: url }));
              }} />
              {editingItem.image_path && (
                <div className="cms-image-preview mt-2">
                  <img src={formatImageUrl(editingItem.image_path)} alt="" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
            <div className="col-12">
              <label className="cms-label">Atau Masukkan URL Gambar Manual</label>
              <input type="text" className="form-control cms-input" value={editingItem.image_path || ""} onChange={(e) => setEditingItem({ ...editingItem, image_path: e.target.value })} placeholder="https://..." />
            </div>
            <div className="col-md-8">
              <label className="cms-label">Nama Kegiatan *</label>
              <input type="text" className="form-control cms-input" required value={editingItem.title || ""} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="cms-label">Badge</label>
              <input type="text" className="form-control cms-input" value={editingItem.badge || ""} onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Icon Emoji (Jika Tanpa Gambar)</label>
              <input type="text" className="form-control cms-input" value={editingItem.emoji || "🕌"} onChange={(e) => setEditingItem({ ...editingItem, emoji: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Jadwal</label>
              <input type="text" className="form-control cms-input" required value={editingItem.jadwal || ""} onChange={(e) => setEditingItem({ ...editingItem, jadwal: e.target.value })} placeholder="cth: Setiap Malam Jumat" />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Warna Background Card</label>
              <select className="form-select cms-input" value={editingItem.bg_class || "kc-1"} onChange={(e) => setEditingItem({ ...editingItem, bg_class: e.target.value })}>
                <option value="kc-1">Hijau Tua</option>
                <option value="kc-2">Biru</option>
                <option value="kc-3">Ungu</option>
                <option value="kc-4">Cokelat</option>
                <option value="kc-5">Hijau Terang</option>
                <option value="kc-6">Biru Tua</option>
              </select>
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="kegActive" checked={editingItem.is_active !== false} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} />
                <label className="form-check-label text-white small" htmlFor="kegActive">Tampilkan Kegiatan</label>
              </div>
            </div>
            <div className="col-12">
              <label className="cms-label">Deskripsi Singkat</label>
              <textarea className="form-control cms-input" rows="3" required value={editingItem.desc || ""} onChange={(e) => setEditingItem({ ...editingItem, desc: e.target.value })}></textarea>
            </div>
            <div className="col-md-6">
              <label className="cms-label">Urutan Tampilan</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
          </div>
        );
      case "artikel":
        return (
          <div className="row g-3">
            <div className="col-12">
              <label className="cms-label">Upload Gambar Artikel</label>
              <div className="cms-upload-placeholder" onClick={() => document.getElementById("file-artikel").click()}>
                <i className="fas fa-cloud-upload-alt" style={{ fontSize: "28px" }}></i>
                <span>Klik untuk Unggah Gambar</span>
              </div>
              <input type="file" id="file-artikel" accept="image/*" className="d-none" onChange={(e) => {
                if (e.target.files[0]) handleImageUpload(e.target.files[0], (url) => setEditingItem({ ...editingItem, gambar_path: url }));
              }} />
              {editingItem.gambar_path && (
                <div className="cms-image-preview mt-2">
                  <img src={formatImageUrl(editingItem.gambar_path)} alt="" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
            <div className="col-12">
              <label className="cms-label">Atau URL Gambar Artikel</label>
              <input type="text" className="form-control cms-input" value={editingItem.gambar_path || ""} onChange={(e) => setEditingItem({ ...editingItem, gambar_path: e.target.value })} placeholder="https://..." />
            </div>
            <div className="col-md-8">
              <label className="cms-label">Judul Artikel *</label>
              <input type="text" className="form-control cms-input" required value={editingItem.judul || ""} onChange={(e) => setEditingItem({ ...editingItem, judul: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="cms-label">Kategori / Tag</label>
              <input type="text" className="form-control cms-input" value={editingItem.tag || ""} onChange={(e) => setEditingItem({ ...editingItem, tag: e.target.value })} placeholder="cth: Kajian Tasawuf" />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Penulis</label>
              <input type="text" className="form-control cms-input" value={editingItem.penulis || "Redaksi"} onChange={(e) => setEditingItem({ ...editingItem, penulis: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Tanggal</label>
              <input type="date" className="form-control cms-input" value={editingItem.tanggal || ""} onChange={(e) => setEditingItem({ ...editingItem, tanggal: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="cms-label">Rangkuman Singkat / Excerpt</label>
              <textarea className="form-control cms-input" rows="2" required value={editingItem.excerpt || ""} onChange={(e) => setEditingItem({ ...editingItem, excerpt: e.target.value })} placeholder="Ringkasan isi artikel..."></textarea>
            </div>
            <div className="col-12">
              <label className="cms-label">Konten Lengkap (HTML Didukung)</label>
              <textarea className="form-control cms-input" rows="6" required value={editingItem.konten || ""} onChange={(e) => setEditingItem({ ...editingItem, konten: e.target.value })} placeholder="Isi tulisan lengkap..."></textarea>
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="artActive" checked={editingItem.is_active !== false} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} />
                <label className="form-check-label text-white small" htmlFor="artActive">Tampilkan Artikel</label>
              </div>
            </div>
          </div>
        );
      case "galeri":
        return (
          <div className="row g-3">
            <div className="col-12">
              <label className="cms-label">Nama Album / Event *</label>
              <input type="text" className="form-control cms-input" required value={editingItem.title || ""} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="cms-label">Deskripsi Singkat Album</label>
              <textarea className="form-control cms-input" rows="2" value={editingItem.description || ""} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}></textarea>
            </div>
            <div className="col-md-6">
              <label className="cms-label">Urutan Album</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="galActive" checked={editingItem.is_active !== false} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} />
                <label className="form-check-label text-white small" htmlFor="galActive">Tampilkan Album</label>
              </div>
            </div>
            <div className="col-12 mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "15px" }}>
              <h5 style={{ fontSize: "14px", color: "var(--gold-light)" }}>Daftar Foto dalam Album ({editingItem.photos?.length || 0} foto)</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "12px 0" }}>
                {(editingItem.photos || []).map((photo, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.03)", border: photo.is_thumbnail ? "1px solid var(--gold-primary)" : "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px" }}>
                    <div style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                      <img src={formatImageUrl(photo.image_path)} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {photo.is_thumbnail && <span style={{ position: "absolute", top: "2px", left: "2px", background: "var(--gold-primary)", color: "#000", fontSize: "9px", fontWeight: 700, padding: "1px 4px", borderRadius: "3px" }}>COVER</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="cms-label" style={{ fontSize: "10px", marginBottom: "3px" }}>Keterangan Foto #{idx + 1}</label>
                      <input type="text" className="form-control cms-input" style={{ padding: "6px 10px", fontSize: "13px" }} value={photo.caption || ""} onChange={(e) => {
                        const updated = [...editingItem.photos];
                        updated[idx] = { ...updated[idx], caption: e.target.value };
                        setEditingItem({ ...editingItem, photos: updated });
                      }} placeholder="Masukkan keterangan/caption foto..." />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {!photo.is_thumbnail && <button type="button" onClick={() => { const updated = editingItem.photos.map((p, i) => ({ ...p, is_thumbnail: i === idx })); setEditingItem({ ...editingItem, photos: updated }); }} className="btn btn-sm btn-outline-warning" style={{ fontSize: "11px", padding: "3px 8px" }}>Jadikan Cover</button>}
                      <button type="button" onClick={() => { const updated = [...editingItem.photos]; updated.splice(idx, 1); setEditingItem({ ...editingItem, photos: updated }); }} className="btn btn-sm btn-outline-danger" style={{ fontSize: "11px", padding: "3px 8px" }}>Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(217, 168, 48, 0.04)", border: "1px dashed var(--border-gold)", padding: "14px", borderRadius: "12px", marginTop: "12px" }}>
                <h6 style={{ fontSize: "13px", color: "var(--gold-light)", marginBottom: "10px" }}>
                  <i className="fas fa-plus-circle me-1"></i> Tambah Foto Baru ke Album
                </h6>
                <label className="cms-label">Keterangan / Caption Foto</label>
                <input type="text" className="form-control cms-input mb-2" id="newPhotoCaption" placeholder="Keterangan foto (cth: Suasana Pengajian Rutin)..." />
                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="cms-label">Upload File Gambar</label>
                    <input type="file" accept="image/*" className="form-control cms-input" onChange={(e) => {
                      if (e.target.files[0]) {
                        handleImageUpload(e.target.files[0], (url) => { document.getElementById("newPhotoUrl").value = url; });
                      }
                    }} />
                  </div>
                  <div className="col-md-6">
                    <label className="cms-label">Atau Masukkan URL Foto Manual</label>
                    <input type="text" className="form-control cms-input" id="newPhotoUrl" placeholder="https://..." />
                  </div>
                </div>
                <button type="button" onClick={() => {
                  let url = document.getElementById("newPhotoUrl").value.trim();
                  const caption = document.getElementById("newPhotoCaption").value;
                  if (!url) return showMsg("error", "Tolong pilih file atau isi URL terlebih dahulu.");
                  const newPhoto = { image_path: url, caption: caption || editingItem.title, is_thumbnail: (editingItem.photos?.length || 0) === 0, urutan: editingItem.photos?.length || 0 };
                  setEditingItem({ ...editingItem, photos: [...(editingItem.photos || []), newPhoto] });
                  document.getElementById("newPhotoUrl").value = ""; document.getElementById("newPhotoCaption").value = "";
                }} className="btn-cms-save" style={{ padding: "8px 20px", fontSize: "12px", marginTop: "6px" }}>+ Tambahkan Foto Ini</button>
              </div>
            </div>
          </div>
        );
      case "video":
        return (
          <div className="row g-3">
            <div className="col-12">
              <label className="cms-label">Judul Video *</label>
              <input type="text" className="form-control cms-input" required value={editingItem.title || ""} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="cms-label">YouTube Video ID / URL *</label>
              <input type="text" className="form-control cms-input" required value={editingItem.youtube_id || ""} onChange={(e) => {
                let val = e.target.value;
                if (val.includes("v=")) { val = val.split("v=")[1]?.split("&")[0] || val; }
                else if (val.includes("youtu.be/")) { val = val.split("youtu.be/")[1]?.split("?")[0] || val; }
                setEditingItem({ ...editingItem, youtube_id: val });
              }} placeholder="Contoh: jFvH8O_fEw4 atau Link YouTube lengkap" />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Urutan Tampilan</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="vidActive" checked={editingItem.is_active !== false} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} />
                <label className="form-check-label text-white small" htmlFor="vidActive">Tampilkan di Halaman Utama</label>
              </div>
            </div>
          </div>
        );
      case "lokasi": // Sosial Media CRUD
        return (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="cms-label">Platform Sosial Media *</label>
              <input type="text" className="form-control cms-input" required value={editingItem.platform || ""} onChange={(e) => setEditingItem({ ...editingItem, platform: e.target.value })} placeholder="Instagram, YouTube, TikTok, dll." />
            </div>
            <div className="col-md-6">
              <label className="cms-label">Warna Brand Hex</label>
              <input type="color" className="form-control cms-input" value={editingItem.color || "#e1306c"} onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })} style={{ height: "42px", padding: "4px 8px" }} />
            </div>
            <div className="col-12">
              <label className="cms-label">URL Profil Lengkap *</label>
              <input type="text" className="form-control cms-input" required value={editingItem.url || ""} onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })} placeholder="https://instagram.com/username" />
            </div>
            <div className="col-md-8">
              <label className="cms-label">Icon FontAwesome Class</label>
              <input type="text" className="form-control cms-input" required value={editingItem.icon || "fab fa-instagram"} onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })} placeholder="fab fa-instagram" />
            </div>
            <div className="col-md-4">
              <label className="cms-label">Urutan</label>
              <input type="number" className="form-control cms-input" value={editingItem.urutan || 0} onChange={(e) => setEditingItem({ ...editingItem, urutan: parseInt(e.target.value) })} />
            </div>
          </div>
        );
      default: return null;
    }
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

          {/* General Settings Form (for tabs with settings) */}
          {["hero", "tentang", "profil", "struktur", "visi", "kegiatan", "artikel", "lokasi"].includes(activeTab) && (
            <form onSubmit={saveSettings} className="cms-card mb-4">
              <div className="cms-card-header">
                <div className="cms-card-icon"><i className={`fas ${CMS_TABS.find(t => t.key === activeTab)?.icon || "fas fa-cog"}`}></i></div>
                <h5>Konfigurasi {CMS_TABS.find(t => t.key === activeTab)?.label}</h5>
              </div>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="cms-label">Badge / Label Section</label>
                  <input type="text" className="form-control cms-input" value={settings[activeTab + "_badge"] || ""} onChange={(e) => setSettings({ ...settings, [activeTab + "_badge"]: e.target.value })} placeholder="Badge section" />
                </div>
                <div className="col-md-9">
                  <label className="cms-label">Judul Utama</label>
                  <input type="text" className="form-control cms-input" value={settings[activeTab + "_title"] || ""} onChange={(e) => setSettings({ ...settings, [activeTab + "_title"]: e.target.value })} placeholder="Judul section" />
                </div>
                <div className="col-12">
                  <label className="cms-label">Subtitle / Deskripsi</label>
                  <textarea className="form-control cms-input" rows="2" value={settings[activeTab + "_subtitle"] || ""} onChange={(e) => setSettings({ ...settings, [activeTab + "_subtitle"]: e.target.value })}></textarea>
                </div>
              </div>
              <div className="mt-3">
                <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> {saving ? "Menyimpan..." : "Simpan Pengaturan Section"}</button>
              </div>
            </form>
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
              <button type="button" onClick={() => { setEditingItem({ is_active: true }); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah</button>
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
              <div className="cms-modal-body">{renderFormInputs()}</div>
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
