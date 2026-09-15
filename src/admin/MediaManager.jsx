import React, { useState, useEffect, useRef } from "react";
import { storage, db } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import "../styles/admin-styles.css";

// Convert file to WebP automatically
async function convertToWebP(file, quality = 0.8) {
  if (!file.type.startsWith("image/")) return file; // Only convert images
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
  const [uploadProgress, setUploadProgress] = useState(0);
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

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Auto convert to WebP if image
        const processedFile = file.type.startsWith("image/") ? await convertToWebP(file) : file;
        const folder = folderFilter === "all" ? "general" : folderFilter;
        const fileName = `${folder}/${Date.now()}_${processedFile.name}`;
        const storageRef = ref(storage, `media/${fileName}`);

        await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, processedFile);
          task.on("state_changed",
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(progress);
            },
            reject,
            async () => {
              const url = await getDownloadURL(task.snapshot.ref);
              await addDoc(collection(db, "media"), {
                name: file.name, // Original name
                storageName: processedFile.name, // WebP name if converted
                url, folder,
                type: processedFile.type,
                size: processedFile.size,
                createdAt: new Date().toISOString()
              });
              resolve();
            }
          );
        });
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    setUploadProgress(0);
    setUploading(false);
    await loadMedia();
  };

  const handleDelete = async (media) => {
    if (!window.confirm(`Hapus media "${media.name}"?`)) return;
    try {
      // Delete from Storage
      const storageRef = ref(storage, media.url);
      await deleteObject(storageRef).catch(() => {}); // Ignore if file not found in storage
      // Delete from Firestore
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
    if (!bytes) return "0 KB";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="cms-card" style={{ background: "#0e171e" }}>
      <div className="cms-card-header justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div className="cms-card-icon"><i className="fas fa-photo-video"></i></div>
          <h5>Media Library</h5>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-cms-save py-2 px-3" disabled={uploading}>
          <i className="fas fa-cloud-upload-alt me-1"></i> {uploading ? `Uploading... ${uploadProgress}%` : "Upload"}
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,application/pdf" className="d-none" onChange={e => handleUpload(e.target.files)} />
      </div>

      <div className="d-flex gap-3 mb-3 flex-wrap px-3">
        <input type="text" className="form-control form-control-sm" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", maxWidth: "250px" }}
          placeholder="Cari nama file..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select className="form-select form-select-sm" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", maxWidth: "150px" }}
          value={folderFilter} onChange={e => setFolderFilter(e.target.value)}>
          {folders.map(f => <option key={f} value={f}>{f === "all" ? "Semua Folder" : f}</option>)}
        </select>
      </div>

      {uploading && (
        <div className="px-3 mb-3">
          <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${uploadProgress}%`, height: "100%", background: "var(--gold-primary)", transition: "width 0.3s" }}></div>
          </div>
          <small className="text-secondary">{uploadProgress}% selesai</small>
        </div>
      )}

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
                {m.type?.startsWith("image/") ? (
                  <img src={m.url} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                ) : m.type?.startsWith("video/") ? (
                  <i className="fas fa-video" style={{ color: "#e8c96e", fontSize: "28px" }}></i>
                ) : (
                  <i className="fas fa-file-pdf" style={{ color: "#f87171", fontSize: "28px" }}></i>
                )}
              </div>
              <div style={{ padding: "8px" }}>
                <p style={{ fontSize: "11px", color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={m.name}>{m.name}</p>
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small className="text-secondary">{formatSize(m.size)}</small>
                  <button className="btn btn-sm" style={{ padding: "0", color: "#f87171", background: "none", border: "none" }} onClick={e => { e.stopPropagation(); handleDelete(m); }}><i className="fas fa-trash"></i></button>
                </div>
              </div>
            </div>
          ))}
          {filteredMedia.length === 0 && <p className="text-secondary text-center w-100">Belum ada media.</p>}
        </div>
      )}
    </div>
  );
}
