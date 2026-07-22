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

// Import styling
import "../styles/admin-styles.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("hero"); // matching Laravel: 'hero', 'tentang', 'profil', 'struktur', 'visi', 'kegiatan', 'artikel', 'galeri', 'video', 'nilai', 'lokasi'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Data states
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

  // Editor states (for add/edit modals)
  const [editingItem, setEditingItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "add" or "edit"

  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    if (!auth) {
      navigate("/admin");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadAllData();
      } else {
        navigate("/admin");
      }
    });
    return unsubscribe;
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const siteSettings = await getSiteSettings();
      setSettings(siteSettings);

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
    } catch (error) {
      console.error("Failed to load CMS data:", error);
      showMsg("error", "Gagal memuat beberapa data dari database.");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mempopulasi database Firestore Anda dengan data default dari website asli? Ini akan menimpa data yang memiliki ID yang sama.")) return;
    setSaving(true);
    try {
      await seedFirestoreDatabase();
      showMsg("success", "Firestore berhasil dipopulasi dengan data default website!");
      await loadAllData();
    } catch (err) {
      console.error(err);
      showMsg("error", "Gagal mempopulasi database: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Image upload handler to Firebase Storage
  const handleImageUpload = (file, callback) => {
    if (!storage) {
      showMsg("error", "Firebase Storage tidak terkonfigurasi.");
      return;
    }
    const storageRef = ref(storage, `landing/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error(error);
        showMsg("error", "Gagal mengunggah gambar ke Storage.");
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        callback(downloadUrl);
        showMsg("success", "Gambar berhasil diunggah!");
      }
    );
  };

  // Save general settings
  const saveGeneralSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "site_config"), settings);
      showMsg("success", "Pengaturan berhasil disimpan!");
    } catch (error) {
      console.error(error);
      showMsg("error", "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  // Generic Add/Edit Save
  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSaving(true);

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

    const collName = collectionMap[activeTab];
    if (!collName) return;

    try {
      if (modalType === "add") {
        await addDoc(collection(db, collName), editingItem);
      } else {
        const docId = editingItem.id;
        const itemCopy = { ...editingItem };
        delete itemCopy.id;
        await setDoc(doc(db, collName, docId), itemCopy);
      }
      setModalOpen(false);
      showMsg("success", "Data berhasil disimpan!");
      await loadAllData();
    } catch (error) {
      console.error(error);
      showMsg("error", "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  // Generic Delete
  const handleDeleteItem = async (id, collName) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, collName, id));
      showMsg("success", "Data berhasil dihapus!");
      await loadAllData();
    } catch (error) {
      console.error(error);
      showMsg("error", "Gagal menghapus data.");
    } finally {
      setSaving(false);
    }
  };

  // Render form inputs inside modal based on active tab
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
                  <div key={idx} style={{ 
                    display: "flex", alignItems: "center", gap: "12px", 
                    background: "rgba(255,255,255,0.03)", border: photo.is_thumbnail ? "1px solid var(--gold-primary)" : "1px solid rgba(255,255,255,0.08)", 
                    borderRadius: "10px", padding: "10px" 
                  }}>
                    <div style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                      <img src={formatImageUrl(photo.image_path)} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {photo.is_thumbnail && (
                        <span style={{ position: "absolute", top: "2px", left: "2px", background: "var(--gold-primary)", color: "#000", fontSize: "9px", fontWeight: 700, padding: "1px 4px", borderRadius: "3px" }}>COVER</span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <label className="cms-label" style={{ fontSize: "10px", marginBottom: "3px" }}>Keterangan Foto #{idx + 1}</label>
                      <input 
                        type="text" 
                        className="form-control cms-input" 
                        style={{ padding: "6px 10px", fontSize: "13px" }}
                        value={photo.caption || ""} 
                        onChange={(e) => {
                          const updated = [...editingItem.photos];
                          updated[idx] = { ...updated[idx], caption: e.target.value };
                          setEditingItem({ ...editingItem, photos: updated });
                        }}
                        placeholder="Masukkan keterangan/caption foto..."
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {!photo.is_thumbnail && (
                        <button type="button" onClick={() => {
                          const updated = editingItem.photos.map((p, i) => ({ ...p, is_thumbnail: i === idx }));
                          setEditingItem({ ...editingItem, photos: updated });
                        }} className="btn btn-sm btn-outline-warning" style={{ fontSize: "11px", padding: "3px 8px" }}>Jadikan Cover</button>
                      )}
                      <button type="button" onClick={() => {
                        const updated = [...editingItem.photos];
                        updated.splice(idx, 1);
                        setEditingItem({ ...editingItem, photos: updated });
                      }} className="btn btn-sm btn-outline-danger" style={{ fontSize: "11px", padding: "3px 8px" }}>Hapus</button>
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
                        handleImageUpload(e.target.files[0], (url) => {
                          document.getElementById("newPhotoUrl").value = url;
                        });
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
                  
                  // Auto convert Google Drive links to direct image URLs
                  if (url.includes("drive.google.com") || url.includes("lh3.googleusercontent.com")) {
                    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                                  url.match(/id=([a-zA-Z0-9_-]+)/) || 
                                  url.match(/\/drive-viewer\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1] && !match[1].startsWith("AKGpi")) {
                      url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                    }
                  }

                  const newPhoto = {
                    image_path: url,
                    caption: caption || editingItem.title,
                    is_thumbnail: (editingItem.photos?.length || 0) === 0,
                    urutan: editingItem.photos?.length || 0
                  };
                  
                  setEditingItem({
                    ...editingItem,
                    photos: [...(editingItem.photos || []), newPhoto]
                  });
                  
                  document.getElementById("newPhotoUrl").value = "";
                  document.getElementById("newPhotoCaption").value = "";
                }} className="btn-cms-save" style={{ padding: "8px 20px", fontSize: "12px", marginTop: "6px" }}>
                  + Tambahkan Foto Ini
                </button>
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
                if (val.includes("v=")) {
                  val = val.split("v=")[1]?.split("&")[0] || val;
                } else if (val.includes("youtu.be/")) {
                  val = val.split("youtu.be/")[1]?.split("?")[0] || val;
                }
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
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin fa-2x mb-3 text-warning"></i>
          <h4>Memuat Panel SIMAYA Admin...</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-body">
      
      {/* ── Sidebar Navigation (Same design as reference layout) ── */}
      <div className="sidebar">
        <div className="sidebar-header">
          <img src="/storage/logo-sm.webp" className="logo-icon" alt="Logo" />
          <span className="logo-text">SIMAYA ADMIN</span>
        </div>
        <div className="nav-menu">
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "hero" ? "active" : ""}`} onClick={() => setActiveTab("hero")}>
              <i className="fas fa-home"></i><span className="nav-text">Hero</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "tentang" ? "active" : ""}`} onClick={() => setActiveTab("tentang")}>
              <i className="fas fa-info-circle"></i><span className="nav-text">Tentang Kami</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "profil" ? "active" : ""}`} onClick={() => setActiveTab("profil")}>
              <i className="fas fa-user-tie"></i><span className="nav-text">Profil & Sejarah</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "struktur" ? "active" : ""}`} onClick={() => setActiveTab("struktur")}>
              <i className="fas fa-sitemap"></i><span className="nav-text">Struktur</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "visi" ? "active" : ""}`} onClick={() => setActiveTab("visi")}>
              <i className="fas fa-bullseye"></i><span className="nav-text">Visi & Misi</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "kegiatan" ? "active" : ""}`} onClick={() => setActiveTab("kegiatan")}>
              <i className="fas fa-calendar-alt"></i><span className="nav-text">Kegiatan</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "artikel" ? "active" : ""}`} onClick={() => setActiveTab("artikel")}>
              <i className="fas fa-newspaper"></i><span className="nav-text">Artikel</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "galeri" ? "active" : ""}`} onClick={() => setActiveTab("galeri")}>
              <i className="fas fa-images"></i><span className="nav-text">Galeri Foto</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "video" ? "active" : ""}`} onClick={() => setActiveTab("video")}>
              <i className="fas fa-video"></i><span className="nav-text">Galeri Video</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "nilai" ? "active" : ""}`} onClick={() => setActiveTab("nilai")}>
              <i className="fas fa-star"></i><span className="nav-text">Nilai Yayasan</span>
            </button>
          </div>
          <div className="nav-item">
            <button className={`nav-link-cms ${activeTab === "lokasi" ? "active" : ""}`} onClick={() => setActiveTab("lokasi")}>
              <i className="fas fa-map-marker-alt"></i><span className="nav-text">Lokasi & Sosial</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="main-content">
        
        {/* Top Header Bar */}
        <div className="top-header">
          <div className="d-flex align-items-center gap-3">
            <div>
              <h4 className="m-0 text-white fw-bold d-flex align-items-center gap-2" style={{ fontSize: "18px" }}>
                <i className="fas fa-layer-group text-warning"></i>
                Manajemen Landing Page SIMAYA
              </h4>
              <div className="d-flex align-items-center gap-2 mt-1">
                <span className="text-secondary small" style={{ fontSize: "12px" }}>
                  <i className="far fa-user me-1 text-warning"></i> {user?.email || "Admin SIMAYA"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <button onClick={handleLogout} className="btn btn-sm btn-danger px-3 py-2" style={{ borderRadius: "50px", background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", fontSize: "12px", fontWeight: 600 }}>
              <i className="fas fa-sign-out-alt me-1"></i> Keluar
            </button>
          </div>
        </div>

        {/* Inner Content Area */}
        <div className="container-fluid py-4" style={{ paddingLeft: "30px", paddingRight: "30px" }}>
          
          {message.text && (
            <div className={`alert alert-${message.type === "success" ? "success" : "danger"} alert-dismissible fade show`} role="alert">
              <i className={`fas fa-${message.type === "success" ? "check-circle" : "exclamation-circle"} me-2`}></i>
              {message.text}
            </div>
          )}

          {/* ═══════════════════ TAB HERO ═══════════════════ */}
          {activeTab === "hero" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-star-and-crescent"></i></div>
                    <h5>Teks & Konten Utama Hero</h5>
                  </div>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="cms-label">Kaligrafi Arab</label>
                      <div className="preview-arabic mb-2">{settings.hero_arabic || "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"}</div>
                      <input type="text" className="form-control cms-input" value={settings.hero_arabic || ""} onChange={(e) => setSettings({ ...settings, hero_arabic: e.target.value })} style={{ direction: "rtl", fontSize: "18px", fontFamily: "Amiri, serif" }} />
                    </div>
                    <div className="col-md-6">
                      <label className="cms-label">Judul Utama Hero</label>
                      <input type="text" className="form-control cms-input" value={settings.hero_title || ""} onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="cms-label">Subtitle Hero</label>
                      <textarea className="form-control cms-input" rows="3" value={settings.hero_subtitle || ""} onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save">
                      <i className="fas fa-save me-2"></i> {saving ? "Menyimpan..." : "Simpan Teks Hero"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Stats Hero CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-chart-bar"></i></div>
                    <div>
                      <h5>Statistik Hero</h5>
                      <small className="text-secondary">Angka-angka yang muncul di landing page</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Stat</button>
                </div>

                <div className="crud-list">
                  {stats.map(item => (
                    <div key={item.id} className="crud-item">
                      <div className="crud-thumb kc-1"><i className={item.icon || "fas fa-chart-line"}></i></div>
                      <div className="crud-info">
                        <span className="crud-title">{item.value}</span>
                        <div className="crud-meta">{item.label}</div>
                      </div>
                      <div className="crud-actions">
                        <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "heroStats")}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB TENTANG ═══════════════════ */}
          {activeTab === "tentang" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-user-tie"></i></div>
                    <h5>Profil Pengasuh & Narasi (Tentang)</h5>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="cms-label">Nama Pengasuh</label>
                      <input type="text" className="form-control cms-input" value={settings.tentang_nama_pengasuh || ""} onChange={(e) => setSettings({ ...settings, tentang_nama_pengasuh: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="cms-label">Jabatan / Peran</label>
                      <input type="text" className="form-control cms-input" value={settings.tentang_peran_pengasuh || ""} onChange={(e) => setSettings({ ...settings, tentang_peran_pengasuh: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Kutipan / Quote</label>
                      <textarea className="form-control cms-input" rows="3" value={settings.tentang_quote || ""} onChange={(e) => setSettings({ ...settings, tentang_quote: e.target.value })}></textarea>
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Paragraf 1</label>
                      <textarea className="form-control cms-input" rows="3" value={settings.tentang_paragraf_1 || ""} onChange={(e) => setSettings({ ...settings, tentang_paragraf_1: e.target.value })}></textarea>
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Paragraf 2</label>
                      <textarea className="form-control cms-input" rows="3" value={settings.tentang_paragraf_2 || ""} onChange={(e) => setSettings({ ...settings, tentang_paragraf_2: e.target.value })}></textarea>
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Paragraf 3</label>
                      <textarea className="form-control cms-input" rows="3" value={settings.tentang_paragraf_3 || ""} onChange={(e) => setSettings({ ...settings, tentang_paragraf_3: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> Simpan Narasi Tentang</button>
                  </div>
                </div>
              </form>

              {/* Pilar Keunggulan CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-th-list"></i></div>
                    <div>
                      <h5>Pilar Keunggulan (Tentang)</h5>
                      <small className="text-secondary">Pilar-pilar penting yang ditampilkan</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Pilar</button>
                </div>

                <div className="crud-list">
                  {features.map(item => (
                    <div key={item.id} className="crud-item">
                      <div className="crud-thumb kc-2"><i className={item.icon || "fas fa-heart"}></i></div>
                      <div className="crud-info">
                        <span className="crud-title">{item.title}</span>
                        <div className="crud-meta">{item.desc}</div>
                      </div>
                      <div className="crud-actions">
                        <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "tentangFeatures")}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB PROFIL & SEJARAH ═══════════════════ */}
          {activeTab === "profil" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-user-tie"></i></div>
                    <h5>Biografi Pengasuh Lengkap</h5>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="cms-label">Nama Lengkap</label>
                      <input type="text" className="form-control cms-input" value={settings.biografi_nama || ""} onChange={(e) => setSettings({ ...settings, biografi_nama: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="cms-label">Jabatan</label>
                      <input type="text" className="form-control cms-input" value={settings.biografi_jabatan || ""} onChange={(e) => setSettings({ ...settings, biografi_jabatan: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="cms-label">Panggilan Akrab</label>
                      <input type="text" className="form-control cms-input" value={settings.biografi_panggilan || ""} onChange={(e) => setSettings({ ...settings, biografi_panggilan: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Quotes Biografi</label>
                      <textarea className="form-control cms-input" rows="2" value={settings.biografi_quote || ""} onChange={(e) => setSettings({ ...settings, biografi_quote: e.target.value })}></textarea>
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Paragraf 1</label>
                      <textarea className="form-control cms-input" rows="3" value={settings.biografi_paragraf_1 || ""} onChange={(e) => setSettings({ ...settings, biografi_paragraf_1: e.target.value })}></textarea>
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Paragraf 2</label>
                      <textarea className="form-control cms-input" rows="3" value={settings.biografi_paragraf_2 || ""} onChange={(e) => setSettings({ ...settings, biografi_paragraf_2: e.target.value })}></textarea>
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Paragraf 3</label>
                      <textarea className="form-control cms-input" rows="3" value={settings.biografi_paragraf_3 || ""} onChange={(e) => setSettings({ ...settings, biografi_paragraf_3: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> Simpan Biografi</button>
                  </div>
                </div>
              </form>

              {/* Timeline Sejarah CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-history"></i></div>
                    <div>
                      <h5>Timeline Perjalanan Sejarah</h5>
                      <small className="text-secondary">Milestone perjalanan sejarah pondok pesantren</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Milestone</button>
                </div>

                <div className="crud-list">
                  {sejarahs.map(item => (
                    <div key={item.id} className="crud-item">
                      <div className="crud-thumb kc-3"><i className="fas fa-clock"></i></div>
                      <div className="crud-info">
                        <span className="crud-title">{item.tahun} — {item.judul}</span>
                        <div className="crud-meta">{item.deskripsi}</div>
                      </div>
                      <div className="crud-actions">
                        <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "sejarahs")}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB STRUKTUR ═══════════════════ */}
          {activeTab === "struktur" && (
            <div className="cms-card">
              <div className="cms-card-header justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="cms-card-icon"><i className="fas fa-sitemap"></i></div>
                  <div>
                    <h5>Struktur Organisasi Yayasan</h5>
                    <small className="text-secondary">Daftar pengurus yayasan dan pembina</small>
                  </div>
                </div>
                <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Pengurus</button>
              </div>

              <div className="crud-list">
                {strukturs.map(item => (
                  <div key={item.id} className="crud-item" style={{ 
                    marginLeft: item.level === 0 ? 0 : (item.level === 1 ? "30px" : "60px"),
                    borderLeft: item.level === 0 ? "4px solid var(--gold)" : (item.level === 1 ? "4px solid #64ffda" : "4px solid #48cae4")
                  }}>
                    <div className="crud-info ms-2">
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <span className="badge-cms" style={{
                          background: item.level === 0 ? "rgba(232,201,110,0.15)" : (item.level === 1 ? "rgba(100,255,218,0.15)" : "rgba(72,202,228,0.15)"),
                          color: item.level === 0 ? "#e8c96e" : (item.level === 1 ? "#64ffda" : "#48cae4")
                        }}>
                          {item.tipe === "leader" ? "Pembina" : item.tipe === "chairman" ? "Ketua" : "Pengurus"}
                        </span>
                        <strong className="text-white fs-6">{item.jabatan}</strong>
                      </div>
                      <div className="crud-meta mt-1">
                        <strong style={{ color: "#fff" }}><i className="far fa-user-circle me-1 text-secondary"></i> {item.nama || "(Tanpa Nama)"}</strong>
                        {item.deskripsi && <span style={{ color: "#aaa" }}> &middot; {item.deskripsi}</span>}
                      </div>
                    </div>
                    <div className="crud-actions">
                      <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                      <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "strukturs")}><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB VISI & MISI ═══════════════════ */}
          {activeTab === "visi" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-eye"></i></div>
                    <h5>Visi Utama Yayasan</h5>
                  </div>
                  <div className="col-12">
                    <label className="cms-label">Pernyataan Visi</label>
                    <textarea className="form-control cms-input" rows="4" value={settings.visi_teks || ""} onChange={(e) => setSettings({ ...settings, visi_teks: e.target.value })} placeholder="Masukkan visi yayasan..."></textarea>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> Simpan Visi</button>
                  </div>
                </div>
              </form>

              {/* Misi CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-bullseye"></i></div>
                    <div>
                      <h5>Misi Yayasan (Butir Kegiatan)</h5>
                      <small className="text-secondary">Daftar langkah taktis pencapaian visi</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Misi</button>
                </div>

                <div className="crud-list">
                  {misis.map(item => (
                    <div key={item.id} className="crud-item">
                      <div className="crud-thumb kc-4"><i className="fas fa-tasks"></i></div>
                      <div className="crud-info">
                        <span className="crud-title">{item.misi_text}</span>
                      </div>
                      <div className="crud-actions">
                        <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "misis")}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB KEGIATAN ═══════════════════ */}
          {activeTab === "kegiatan" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-heading"></i></div>
                    <h5>Header Section Kegiatan Halaman Utama</h5>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="cms-label">Badge</label>
                      <input type="text" className="form-control cms-input" value={settings.kegiatan_badge || ""} onChange={(e) => setSettings({ ...settings, kegiatan_badge: e.target.value })} />
                    </div>
                    <div className="col-md-9">
                      <label className="cms-label">Judul Utama Section</label>
                      <input type="text" className="form-control cms-input" value={settings.kegiatan_title || ""} onChange={(e) => setSettings({ ...settings, kegiatan_title: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Subtitle / Deskripsi Singkat</label>
                      <textarea className="form-control cms-input" rows="2" value={settings.kegiatan_subtitle || ""} onChange={(e) => setSettings({ ...settings, kegiatan_subtitle: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> Simpan Header Kegiatan</button>
                  </div>
                </div>
              </form>

              {/* Kegiatan CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-calendar-alt"></i></div>
                    <div>
                      <h5>Daftar Kegiatan Rutin & Insidental</h5>
                      <small className="text-secondary">Total: {kegiatans.length} kegiatan aktif</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Kegiatan</button>
                </div>

                <div className="crud-list">
                  {kegiatans.map(item => (
                    <div key={item.id} className="crud-item">
                      <div className={`crud-thumb ${item.bg_class || "kc-1"}`}>
                        {item.image_path ? (
                          <img src={formatImageUrl(item.image_path)} alt="" referrerPolicy="no-referrer" />
                        ) : (
                          item.emoji || "🕌"
                        )}
                      </div>
                      <div className="crud-info">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="crud-title">{item.title}</span>
                          {item.badge && <span className="badge-cms">{item.badge}</span>}
                          {item.is_active === false && <span className="badge-inactive">Non-aktif</span>}
                        </div>
                        <div className="crud-meta"><i className="fas fa-clock me-1"></i> {item.jadwal || "-"}</div>
                      </div>
                      <div className="crud-actions">
                        <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "kegiatans")}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB ARTIKEL ═══════════════════ */}
          {activeTab === "artikel" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-heading"></i></div>
                    <h5>Header Section Kajian & Artikel</h5>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="cms-label">Badge</label>
                      <input type="text" className="form-control cms-input" value={settings.artikel_badge || ""} onChange={(e) => setSettings({ ...settings, artikel_badge: e.target.value })} />
                    </div>
                    <div className="col-md-9">
                      <label className="cms-label">Judul Utama</label>
                      <input type="text" className="form-control cms-input" value={settings.artikel_title || ""} onChange={(e) => setSettings({ ...settings, artikel_title: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Subdeskripsi</label>
                      <textarea className="form-control cms-input" rows="2" value={settings.artikel_subtitle || ""} onChange={(e) => setSettings({ ...settings, artikel_subtitle: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> Simpan Header Artikel</button>
                  </div>
                </div>
              </form>

              {/* Artikel CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-newspaper"></i></div>
                    <div>
                      <h5>Daftar Artikel & Untaian Nasihat Ruhani</h5>
                      <small className="text-secondary">Daftar tulisan kajian ilmiah kepesantrenan</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Artikel</button>
                </div>

                <div className="crud-list">
                  {artikels.map(item => (
                    <div key={item.id} className="crud-item align-items-start" style={{ padding: "20px" }}>
                      <div className="crud-thumb" style={{ width: "110px", height: "80px", borderRadius: "8px", overflow: "hidden", background: "rgba(0,0,0,0.3)" }}>
                        {item.gambar_path ? (
                          <img src={formatImageUrl(item.gambar_path)} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.1)" }}><i className="fas fa-newspaper fa-2x"></i></div>
                        )}
                      </div>
                      <div className="crud-info ms-3">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span className="crud-title" style={{ fontSize: "15px" }}>{item.judul}</span>
                          {item.tag && <span className="badge-cms" style={{ background: "rgba(64,145,108,0.2)", color: "#7cfc00", borderColor: "rgba(64,145,108,0.4)" }}>{item.tag}</span>}
                          {item.is_active === false && <span className="badge-inactive">Non-aktif</span>}
                        </div>
                        <div className="crud-meta mb-2" style={{ fontSize: "12px" }}><i className="far fa-calendar-alt me-1"></i> {item.tanggal} &middot; <i className="far fa-user me-1"></i> {item.penulis}</div>
                        <div style={{ fontSize: "13px", color: "#aaa", lineBreak: "anywhere", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.excerpt}</div>
                      </div>
                      <div className="crud-actions ms-auto d-flex flex-column gap-2">
                        <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "artikels")}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB GALERI ═══════════════════ */}
          {activeTab === "galeri" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-heading"></i></div>
                    <h5>Header Section Galeri Dokumentasi</h5>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="cms-label">Badge</label>
                      <input type="text" className="form-control cms-input" value={settings.galeri_badge || ""} onChange={(e) => setSettings({ ...settings, galeri_badge: e.target.value })} />
                    </div>
                    <div className="col-md-9">
                      <label className="cms-label">Judul Utama Galeri</label>
                      <input type="text" className="form-control cms-input" value={settings.galeri_title || ""} onChange={(e) => setSettings({ ...settings, galeri_title: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Subdeskripsi Galeri</label>
                      <textarea className="form-control cms-input" rows="2" value={settings.galeri_subtitle || ""} onChange={(e) => setSettings({ ...settings, galeri_subtitle: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> Simpan Header Galeri</button>
                  </div>
                </div>
              </form>

              {/* Galeri Album CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-images"></i></div>
                    <div>
                      <h5>Galeri Album Kegiatan & Event</h5>
                      <small className="text-secondary">Unggah beberapa foto dokumentasi dalam satu nama album</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({ photos: [] }); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Album</button>
                </div>

                <div className="row g-4 mt-1">
                  {galeriEvents.map(item => {
                    const thumbPhoto = item.photos?.find(p => p.is_thumbnail) || item.photos?.[0];
                    return (
                      <div key={item.id} className="col-md-4 col-sm-6">
                        <div className="crud-item" style={{ flexDirection: "column", padding: "0", overflow: "hidden", alignItems: "stretch" }}>
                          <div style={{ height: "160px", background: "#000", position: "relative" }}>
                            {thumbPhoto ? (
                              <img src={thumbPhoto.image_path.startsWith("http") ? thumbPhoto.image_path : `/storage/${thumbPhoto.image_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.2)" }}><i className="far fa-image fa-2x"></i></div>
                            )}
                          </div>
                          <div className="p-3">
                            <h6 style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>{item.title}</h6>
                            <p style={{ fontSize: "12px", color: "#aaa", height: "36px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", margin: "4px 0" }}>{item.description || "Tidak ada deskripsi."}</p>
                            
                            <div className="d-flex gap-2 my-2 align-items-center">
                              <span className="badge-cms" style={{ fontSize: "10px" }}><i className="fas fa-images"></i> {item.photos?.length || 0} Foto</span>
                              {item.is_active === false && <span className="badge-inactive" style={{ fontSize: "10px" }}>Non-aktif</span>}
                            </div>
                            
                            <div className="d-flex gap-2 border-top border-secondary pt-3 mt-2">
                              <button type="button" className="btn-crud-edit flex-grow-1 text-center justify-content-center" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit Album</button>
                              <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "galeriEvents")}><i className="fas fa-trash"></i></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB VIDEO ═══════════════════ */}
          {activeTab === "video" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-heading"></i></div>
                    <h5>Header Section Galeri Video</h5>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="cms-label">Badge</label>
                      <input type="text" className="form-control cms-input" value={settings.video_badge || ""} onChange={(e) => setSettings({ ...settings, video_badge: e.target.value })} />
                    </div>
                    <div className="col-md-9">
                      <label className="cms-label">Judul Utama Halaman Video</label>
                      <input type="text" className="form-control cms-input" value={settings.video_title || ""} onChange={(e) => setSettings({ ...settings, video_title: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Subdeskripsi Halaman Video</label>
                      <textarea className="form-control cms-input" rows="2" value={settings.video_subtitle || ""} onChange={(e) => setSettings({ ...settings, video_subtitle: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> Simpan Header Video</button>
                  </div>
                </div>
              </form>

              {/* Video CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-video"></i></div>
                    <div>
                      <h5>Galeri Video YouTube</h5>
                      <small className="text-secondary">Daftar rekaman video kajian, sholawat, dan pengajian umum</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Video</button>
                </div>

                <div className="crud-list">
                  {videos.map(item => (
                    <div key={item.id} className="crud-item">
                      <div className="crud-thumb kc-6"><i className="fab fa-youtube text-danger"></i></div>
                      <div className="crud-info">
                        <span className="crud-title">{item.title}</span>
                        <div className="crud-meta">YouTube Video ID: <code>{item.youtube_id}</code></div>
                      </div>
                      <div className="crud-actions">
                        <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "videos")}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB NILAI ═══════════════════ */}
          {activeTab === "nilai" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-heading"></i></div>
                    <h5>Header Section Nilai & Pilar Halaman Utama</h5>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="cms-label">Badge</label>
                      <input type="text" className="form-control cms-input" value={settings.nilai_badge || ""} onChange={(e) => setSettings({ ...settings, nilai_badge: e.target.value })} />
                    </div>
                    <div className="col-md-9">
                      <label className="cms-label">Judul Utama Nilai</label>
                      <input type="text" className="form-control cms-input" value={settings.nilai_title || ""} onChange={(e) => setSettings({ ...settings, nilai_title: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Subdeskripsi Nilai</label>
                      <textarea className="form-control cms-input" rows="2" value={settings.nilai_subtitle || ""} onChange={(e) => setSettings({ ...settings, nilai_subtitle: e.target.value })}></textarea>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> Simpan Header Nilai</button>
                  </div>
                </div>
              </form>

              {/* Nilai & Pilar CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-star"></i></div>
                    <div>
                      <h5>Nilai & Pilar Pesantren Ahlus-Shafa Wal-Wafa</h5>
                      <small className="text-secondary">Nilai spiritual tasawuf dasar pembinaan jamaah</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Nilai</button>
                </div>

                <div className="crud-list">
                  {nilais.map(item => (
                    <div key={item.id} className="crud-item">
                      <div className="crud-thumb kc-1"><i className={item.icon || "fas fa-leaf"}></i></div>
                      <div className="crud-info">
                        <span className="crud-title">{item.title}</span>
                        <div className="crud-meta">{item.desc}</div>
                      </div>
                      <div className="crud-actions">
                        <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "nilais")}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ TAB LOKASI & SOSIAL ═══════════════════ */}
          {activeTab === "lokasi" && (
            <div>
              <form onSubmit={saveGeneralSettings} className="mb-4">
                <div className="cms-card">
                  <div className="cms-card-header">
                    <div className="cms-card-icon"><i className="fas fa-map-marked-alt"></i></div>
                    <h5>Informasi Lokasi Cabang / Pesantren Pusat</h5>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="cms-label">Badge Section Lokasi</label>
                      <input type="text" className="form-control cms-input" value={settings.lokasi_badge || ""} onChange={(e) => setSettings({ ...settings, lokasi_badge: e.target.value })} />
                    </div>
                    <div className="col-md-9">
                      <label className="cms-label">Judul Utama Section Lokasi</label>
                      <input type="text" className="form-control cms-input" value={settings.lokasi_title || ""} onChange={(e) => setSettings({ ...settings, lokasi_title: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Subdeskripsi Section Lokasi</label>
                      <textarea className="form-control cms-input" rows="2" value={settings.lokasi_subtitle || ""} onChange={(e) => setSettings({ ...settings, lokasi_subtitle: e.target.value })}></textarea>
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Alamat Lengkap Kantor / Pesantren</label>
                      <textarea className="form-control cms-input" rows="2" value={settings.lokasi_alamat || ""} onChange={(e) => setSettings({ ...settings, lokasi_alamat: e.target.value })}></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="cms-label">Jenis Lembaga</label>
                      <input type="text" className="form-control cms-input" value={settings.lokasi_jenis || ""} onChange={(e) => setSettings({ ...settings, lokasi_jenis: e.target.value })} placeholder="Pondok Pesantren Tarekat" />
                    </div>
                    <div className="col-md-6">
                      <label className="cms-label">Info Kegiatan Terbuka</label>
                      <input type="text" className="form-control cms-input" value={settings.lokasi_kegiatan_terbuka || ""} onChange={(e) => setSettings({ ...settings, lokasi_kegiatan_terbuka: e.target.value })} placeholder="Kajian Terbuka Untuk Umum" />
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Google Maps Embed URL (Iframe Src)</label>
                      <textarea className="form-control cms-input" rows="2" value={settings.lokasi_maps_embed_url || ""} onChange={(e) => setSettings({ ...settings, lokasi_maps_embed_url: e.target.value })} placeholder="https://www.google.com/maps/embed?..."></textarea>
                    </div>
                    <div className="col-12">
                      <label className="cms-label">Link Navigasi Google Maps (Arah Navigasi)</label>
                      <input type="text" className="form-control cms-input" value={settings.lokasi_maps_link || ""} onChange={(e) => setSettings({ ...settings, lokasi_maps_link: e.target.value })} placeholder="https://maps.google.com/?q=..." />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button type="submit" disabled={saving} className="btn-cms-save"><i className="fas fa-save me-2"></i> Simpan Lokasi</button>
                  </div>
                </div>
              </form>

              {/* Media Sosial CRUD */}
              <div className="cms-card">
                <div className="cms-card-header justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="cms-card-icon"><i className="fas fa-share-alt"></i></div>
                    <div>
                      <h5>Akun Media Sosial Resmi Yayasan</h5>
                      <small className="text-secondary">Daftar media sosial yang muncul di bagian footer website</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setEditingItem({}); setModalType("add"); setModalOpen(true); }} className="btn btn-sm btn-cms-save py-2 px-3">+ Tambah Medsos</button>
                </div>

                <div className="crud-list">
                  {sosials.map(item => (
                    <div key={item.id} className="crud-item">
                      <div className="crud-thumb" style={{ background: `${item.color || "#333"}1a`, border: `1px solid ${item.color || "#555"}44` }}>
                        <i className={item.icon || "fas fa-link"} style={{ color: item.color || "#aaa", fontSize: "20px" }}></i>
                      </div>
                      <div className="crud-info">
                        <span className="crud-title">{item.platform}</span>
                        <div className="crud-meta">Link: <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "var(--gold-light)" }}>{item.url}</a></div>
                      </div>
                      <div className="crud-actions">
                        <button type="button" className="btn-crud-edit" onClick={() => { setEditingItem(item); setModalType("edit"); setModalOpen(true); }}>Edit</button>
                        <button type="button" className="btn-crud-delete" onClick={() => handleDeleteItem(item.id, "sosials")}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* redone modal matching the original cms styling */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="w-100" style={{ maxWidth: "650px", pointerEvents: "auto" }}>
            <div className="cms-card cms-modal mb-0 p-0" style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "16px", background: "#111" }}>
              <div className="cms-card-header p-4 border-bottom border-secondary mb-0">
                <h5 className="m-0 text-white" style={{ textTransform: "capitalize" }}>
                  <i className="fas fa-edit me-2 text-warning"></i>
                  {modalType === "add" ? "Tambah" : "Edit"} Data {activeTab}
                </h5>
              </div>
              
              <form onSubmit={handleSaveItem}>
                <div className="modal-body p-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                  {renderFormInputs()}
                </div>
                
                <div className="modal-footer p-3 border-top border-secondary d-flex justify-content-end gap-2 bg-dark">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-sm btn-secondary">
                    Batal
                  </button>
                  <button type="submit" disabled={saving} className="btn-cms-save" style={{ padding: "8px 24px", fontSize: "13px" }}>
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
