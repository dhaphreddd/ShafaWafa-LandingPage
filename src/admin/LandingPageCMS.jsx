import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage, getSiteSettings, getCollectionData, seedFirestoreDatabase } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, collection, addDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { formatImageUrl } from "../utils/imageHelper";
import "../styles/admin-styles.css";

export default function LandingPageCMS() {
  const [activeTab, setActiveTab] = useState("hero");
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState([]);
  const [nilais, setNilais] = useState([]);
  const [kegiatans, setKegiatans] = useState([]);
  const [artikels, setArtikels] = useState([]);
  const [galeriEvents, setGaleriEvents] = useState([]);
  const [videos, setVideos] = useState([]);
  const [sosials, setSosials] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (!u) navigate("/admin"); });
    loadData();
    return unsub;
  }, [navigate]);

  const loadData = async () => {
    setSettings(await getSiteSettings());
    setStats(await getCollectionData("heroStats", "landing_hero_stats"));
    setNilais(await getCollectionData("nilais", "landing_nilais"));
    setKegiatans(await getCollectionData("kegiatans", "landing_kegiatans"));
    setArtikels(await getCollectionData("artikels", "landing_artikels"));
    setGaleriEvents(await getCollectionData("galeriEvents", "landing_galeri_events"));
    setVideos(await getCollectionData("videos", "landing_videos"));
    setSosials(await getCollectionData("sosials", "landing_sosials"));
  };

  return (
    <div className="admin-body">
      <div className="sidebar">
        <div className="sidebar-header">
           <img src={formatImageUrl("logo-sm.webp")} className="logo-icon" alt="Logo" />
           <span className="logo-text">CMS ADMIN</span>
        </div>
        <div className="nav-menu">
           {['hero', 'tentang', 'profil', 'struktur', 'visi', 'kegiatan', 'artikel', 'galeri', 'video', 'nilai', 'lokasi'].map(tab => (
             <div className="nav-item" key={tab}>
                <button className={`nav-link-cms ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                  <span className="nav-text capitalize">{tab}</span>
                </button>
             </div>
           ))}
           <div className="nav-item mt-4 border-t border-white/10 pt-2">
             <button className="nav-link-cms text-warning" onClick={() => navigate("/admin/simaya")}>
                <i className="fas fa-arrow-left"></i> Kembali ke SIMAYA
             </button>
           </div>
        </div>
      </div>
      <div className="main-content p-6 text-white">
         <h1>CMS Landing Page: {activeTab.toUpperCase()}</h1>
         {/* Render konten CMS berdasarkan activeTab */}
      </div>
    </div>
  );
}
