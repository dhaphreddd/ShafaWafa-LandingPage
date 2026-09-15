import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { formatImageUrl } from "../utils/imageHelper";
import "../styles/admin-styles.css";

// Extract Google Drive file ID from various URL formats
function extractGoogleDriveId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                url.match(/\/drive-viewer\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Generate display URL from Google Drive ID
function gdriveToDirectUrl(fileId) {
  return `https://wsrv.nl/?url=https://drive.google.com/uc?id=${fileId}`;
}

// Convert file to WebP automatically
async function convertToWebP(file, quality = 0.8) {
  if (!file.type.startsWith("image/")) return file;
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 5,
      maxWidthOrHeight: 1920,
      initialQuality: quality,
      fileType: "image/webp"
    });
    const webpName = file.name.replace(/\.(jpg|jpeg|png|gif|bmp)$/i, ".webp");
    return new File([compressed], webpName, { type: "image/webp" });
  } catch (err) {
    console.error("WebP conversion failed, using original:", err);
    return file;
  }
}

export default function MediaManager({ onSelect, multiSelect = false }) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [driveLink, setDriveLink] = useState("");
  const [mediaName, setMediaName] = useState("");
  const [mediaFolder, setMediaFolder] = useState("general");
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "media"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setMediaList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!driveLink.trim()) return;

    setUploading(true);
    try {
      const fileId = extractGoogleDriveId(driveLink);
      if (!fileId) {
        alert("Link Google Drive tidak valid. Pastikan format: https://drive.google.com/file/d/XXXX/view");
        setUploading(false);
        return;
      }

      const displayUrl = gdriveToDirectUrl(fileId);
      await addDoc(collection(db, "media"), {
        name: mediaName || "Unnamed Media",
        driveLink: driveLink.trim(),
        fileId,
        url: displayUrl,
        folder: mediaFolder || "general",
        type: "image/webp",
        createdAt: new Date().toISOString()
      });

      setDriveLink("");
      setMediaName("");
      setShowAddModal(false);
      await loadMedia();
    } catch (err) {
      console.error("Failed to add media:", err);
      alert("Gagal menambah media: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const processedFile = file.type.startsWith("image/") ? await convertToWebP(file) : file;
        // Create a temporary local URL for the processed file
        const localUrl = URL.createObjectURL(processedFile);
        const folder = folderFilter === "all" ? "general" : folderFilter;

        await addDoc(collection(db, "media"), {
          name: file.name,
          localUrl,
          url: localUrl,
          folder,
          type: processedFile.type,
          size: processedFile.size,
          isLocal: true,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
      }
    }
    setUploading(false);
    await loadMedia();
    e.target.value = "";
  };

  const handleDelete = async (media) => {
    if (!window.confirm(`Hapus media "${media.name}"?`)) return;
    try {
      if (media.localUrl) URL.revokeObjectURL(media.localUrl);
      await deleteDoc(doc(db, "media", media.id));
      setMediaList(prev => prev.filter(m => m.id !== media.id));
    } catch (err) {
      console.error("Failed to delete media:", err);
    }
  };

  const toggleSelect = (media) => {
    if (multiSelect) {
      setSelected(prev => prev.includes(media.id) ? prev.filter(id => id !== media.id) : [...prev, media]);
    } else {
      setSelected([media.id]);
      if (onSelect) onSelect(media);
    }
  };

  const folders = ["all", ...new Set(mediaList.map(m => m.folder || "general"))];

  const filteredMedia = mediaList.filter(m => {
    const matchSearch = !searchTerm || m.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFolder = folderFilter === "all" || m.folder === folderFilter;
    return matchSearch && matchFolder;
  });

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="cms-card" style={{ background: "#0e171e" }}>
      <div className="cms-card-header justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div className="cms-card-icon"><i className="fas fa-photo-video"></i></div>
          <div>
            <h5>Media Library</h5>
            <small className="text-secondary">{mediaList.length} file tersimpan</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn btn-sm btn-cms-save py-2 px-3" disabled={uploading}>
            <i className="fas fa-link me-1"></i> Tambah dari Google Drive
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-outline-secondary py-2 px-3" disabled={uploading}>
            <i className="fas fa-laptop me-1"></i> Upload Lokal
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="d-none" onChange={handleBulkUpload} />
        </div>
      </div>

      <div className="d-flex gap-3 mb-3 flex-wrap px-3">
        <input type="text" className="form-control form-control-sm" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", maxWidth: "250px" }}
          placeholder="Cari nama file..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select className="form-select form-select-sm" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", maxWidth: "150px" }}
          value={folderFilter} onChange={e => setFolderFilter(e.target.value)}>
          {folders.map(f => <option key={f} value={f}>{f === "all" ? "Semua Folder" : f}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center p-4"><i className="fas fa-spinner fa-spin text-warning"></i> Loading...</div>
      ) : (
        <div className="d-flex flex-wrap gap-3 px-3 pb-3">
          {filteredMedia.map(m => (
            <div key={m.id} onClick={() => toggleSelect(m)} style={{
              width: "140px", borderRadius: "12px", overflow: "hidden", cursor: "pointer",
              border: selected.includes(m.id) ? "2px solid var(--gold-primary)" : "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.3)", transition: "all 0.2s"
            }}>
              <div style={{ height: "100px", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {m.url ? (
                  <img src={formatImageUrl(m.url)} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" referrerPolicy="no-referrer" />
                ) : m.type?.startsWith("video/") ? (
                  <i className="fas fa-video" style={{ color: "#e8c96e", fontSize: "28px" }}></i>
                ) : (
                  <i className="fas fa-file" style={{ color: "#9ca3af", fontSize: "28px" }}></i>
                )}
              </div>
              <div style={{ padding: "8px" }}>
                <p style={{ fontSize: "11px", color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={m.name}>{m.name}</p>
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small className="text-secondary">{formatSize(m.size) || m.folder}</small>
                  <button className="btn btn-sm" style={{ padding: "0", color: "#f87171", background: "none", border: "none" }} onClick={e => { e.stopPropagation(); handleDelete(m); }}><i className="fas fa-trash"></i></button>
                </div>
              </div>
            </div>
          ))}
          {filteredMedia.length === 0 && <p className="text-secondary text-center w-100">Belum ada media.</p>}
        </div>
      )}

      {showAddModal && (
        <div className="cms-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="cms-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="cms-modal-header">
              <h5>Tambah Media dari Google Drive</h5>
              <button className="btn-close-custom" onClick={() => setShowAddModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAddMedia}>
              <div className="cms-modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="cms-label">Link Google Drive *</label>
                    <input type="url" className="form-control cms-input" required value={driveLink} onChange={e => setDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/XXXXX/view?usp=sharing" />
                    <small className="text-secondary">Paste link sharing Google Drive (pastikan akses: "Anyone with the link can view")</small>
                  </div>
                  <div className="col-12">
                    <label className="cms-label">Nama File</label>
                    <input type="text" className="form-control cms-input" value={mediaName} onChange={e => setMediaName(e.target.value)} placeholder="cth: Foto Kegiatan Reboan" />
                  </div>
                  <div className="col-12">
                    <label className="cms-label">Folder</label>
                    <select className="form-select cms-input" value={mediaFolder} onChange={e => setMediaFolder(e.target.value)}>
                      <option value="general">General</option>
                      <option value="artikel">Artikel</option>
                      <option value="kegiatan">Kegiatan</option>
                      <option value="galeri">Galeri</option>
                      <option value="profile">Profile</option>
                      <option value="dokumen">Dokumen</option>
                    </select>
                  </div>
                  {driveLink && extractGoogleDriveId(driveLink) && (
                    <div className="col-12">
                      <label className="cms-label">Preview</label>
                      <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <img src={gdriveToDirectUrl(extractGoogleDriveId(driveLink))} alt="Preview"
                          style={{ width: "100%", maxHeight: "200px", objectFit: "contain", background: "#000" }}
                          referrerPolicy="no-referrer" onError={e => e.target.style.display = "none"} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="cms-modal-footer">
                <button type="button" className="btn-cms-cancel" onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" disabled={uploading || !driveLink.trim()} className="btn-cms-save">
                  {uploading ? "Menyimpan..." : "Simpan Media"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
