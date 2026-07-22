import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getSiteSettings, getCollectionData } from "../firebase";
import { formatImageUrl } from "../utils/imageHelper";

export default function Home({ settings }) {
  const [heroStats, setHeroStats] = useState([]);
  const [nilaiList, setNilaiList] = useState([]);
  const [kegiatanList, setKegiatanList] = useState([]);
  const [artikelList, setArtikelList] = useState([]);
  const [galeriList, setGaleriList] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [sosialList, setSosialList] = useState([]);

  // Modal / Lightbox states
  const [activeArticle, setActiveArticle] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Zoom states for event photo lightbox
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      const stats = await getCollectionData("heroStats", "landing_hero_stats");
      const nilais = await getCollectionData("nilais", "landing_nilais");
      const kegiatans = await getCollectionData("kegiatans", "landing_kegiatans");
      const articles = await getCollectionData("artikels", "landing_artikels");
      const galleries = await getCollectionData("galeriEvents", "landing_galeri_events");
      const videos = await getCollectionData("videos", "landing_videos");
      const socials = await getCollectionData("sosials", "landing_sosials");

      const activeStats = stats.filter(item => item.is_active !== false);
      setHeroStats(activeStats.length > 0 ? activeStats : [
        { id: "s1", label: "Tahun Berdiri", value: "2002" },
        { id: "s2", label: "Santri Pembinaan", value: "350+" },
        { id: "s3", label: "Majelis Cabang", value: "12" }
      ]);

      const activeNilais = nilais.filter(item => item.is_active !== false);
      setNilaiList(activeNilais);

      const activeKegiatans = kegiatans.filter(item => item.is_active !== false);
      setKegiatanList(activeKegiatans.slice(0, 6));

      const activeArticles = articles.filter(item => item.is_active !== false);
      setArtikelList(activeArticles.slice(0, 3));

      const activeGalleries = galleries.filter(item => item.is_active !== false);
      setGaleriList(activeGalleries.length > 0 ? activeGalleries.slice(0, 3) : [
        {
          id: "g1",
          title: "Majelis Reboan Agung & Doa Bersama",
          photos: [
            { image_path: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80", is_thumbnail: true }
          ]
        },
        {
          id: "g2",
          title: "Pemberian Santunan Anak Yatim Yayasan",
          photos: [
            { image_path: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80", is_thumbnail: true }
          ]
        },
        {
          id: "g3",
          title: "Kajian Ruhani & Tafsir Al-Hikam",
          photos: [
            { image_path: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80", is_thumbnail: true }
          ]
        }
      ]);

      const activeVideos = videos.filter(item => item.is_active !== false);
      setVideoList(activeVideos.length > 0 ? activeVideos.slice(0, 3) : [
        {
          id: "v1",
          title: "Kajian Rutin Tafsir Kitab Al-Hikam - Buya Ahlus-Shafa",
          youtube_id: "dQw4w9WgXcQ"
        },
        {
          id: "v2",
          title: "Dokumentasi Majelis Sholawat Akbar Menyambut Bulan Suci",
          youtube_id: "dQw4w9WgXcQ"
        },
        {
          id: "v3",
          title: "Aksi Sosial & Gotong Royong PP Ahlus Shafa Wal Wafa",
          youtube_id: "dQw4w9WgXcQ"
        }
      ]);

      setSosialList(socials.filter(item => item.is_active !== false));
    }
    loadData();
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [heroStats, nilaiList, kegiatanList, artikelList, galeriList, videoList, sosialList, activeEvent, activeVideoId, activeArticle]);

  // Video lightbox handlers
  const openVideoPlayer = (youtubeId) => {
    setActiveVideoId(youtubeId);
    document.body.style.overflow = "hidden";
  };

  const closeVideoPlayer = () => {
    setActiveVideoId(null);
    document.body.style.overflow = "";
  };

  // Event lightbox handlers
  const openEventLightbox = (event) => {
    if (!event.photos || event.photos.length === 0) return;
    setActiveEvent(event);
    setActivePhotoIdx(0);
    resetZoom();
    document.body.style.overflow = "hidden";
  };

  const closeEventLightbox = () => {
    setActiveEvent(null);
    document.body.style.overflow = "";
  };

  const nextEventImage = () => {
    if (!activeEvent) return;
    resetZoom();
    setActivePhotoIdx((prev) => (prev + 1) % activeEvent.photos.length);
  };

  const prevEventImage = () => {
    if (!activeEvent) return;
    resetZoom();
    setActivePhotoIdx((prev) => (prev - 1 + activeEvent.photos.length) % activeEvent.photos.length);
  };

  // Zoom / Pan handlers
  const resetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Bounds check
    const img = imgRef.current;
    if (img) {
      const limitX = ((zoomScale - 1) * img.offsetWidth) / 2;
      const limitY = ((zoomScale - 1) * img.offsetHeight) / 2;
      setPanPosition({
        x: Math.min(Math.max(newX, -limitX), limitX),
        y: Math.min(Math.max(newY, -limitY), limitY)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    const img = imgRef.current;
    if (img) {
      const limitX = ((zoomScale - 1) * img.offsetWidth) / 2;
      const limitY = ((zoomScale - 1) * img.offsetHeight) / 2;
      setPanPosition({
        x: Math.min(Math.max(newX, -limitX), limitX),
        y: Math.min(Math.max(newY, -limitY), limitY)
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(prev + 0.15, 4));
    } else {
      setZoomScale((prev) => {
        const next = Math.max(prev - 0.15, 1);
        if (next === 1) setPanPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeEvent) {
        if (e.key === "ArrowLeft") prevEventImage();
        if (e.key === "ArrowRight") nextEventImage();
        if (e.key === "Escape") closeEventLightbox();
      }
      if (activeVideoId && e.key === "Escape") closeVideoPlayer();
      if (activeArticle && e.key === "Escape") {
        setActiveArticle(null);
        document.body.style.overflow = "";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeEvent, activeVideoId, activeArticle]);

  // Mobile list auto scroll helper logic
  const kegiatanGridRef = useRef(null);
  const artikelGridRef = useRef(null);
  const galleryGridRef = useRef(null);
  const videoGridRef = useRef(null);

  const initMobileScroll = (ref, isRtl = false) => {
    const el = ref.current;
    if (!el) return;
    let intervalId;

    const startScroll = () => {
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (window.innerWidth > 768) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= maxScroll - 5) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
        }
      }, 4000);
    };

    const stopScroll = () => clearInterval(intervalId);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startScroll();
        } else {
          stopScroll();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(el);
    el.addEventListener("touchstart", stopScroll, { passive: true });
    el.addEventListener("touchend", startScroll, { passive: true });

    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
  };

  useEffect(() => {
    const clean1 = initMobileScroll(kegiatanGridRef);
    const clean2 = initMobileScroll(artikelGridRef);
    const clean3 = initMobileScroll(galleryGridRef);
    const clean4 = initMobileScroll(videoGridRef);
    return () => {
      if (clean1) clean1();
      if (clean2) clean2();
      if (clean3) clean3();
      if (clean4) clean4();
    };
  }, [kegiatanList, artikelList, galeriList, videoList]);

  return (
    <div className="home-root">
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-pattern"></div>
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-arabic">{settings.hero_arabic || "أَهْلُ الصَّفَا وَالْوَفَا"}</div>
            <h1 className="hero-title">
              {settings.hero_title || "Yayasan Pesantren Ahlus-Shafa Wal-Wafa"}
            </h1>
            <p className="hero-subtitle">
              {settings.hero_subtitle || "Pondok pesantren tarekat pembinaan rohani di Wonoayu, Sidoarjo."}
            </p>
            <div className="hero-actions">
              <Link to="/kegiatan" className="btn-primary">
                <i className="fas fa-calendar-alt"></i> Lihat Kegiatan
              </Link>
              <Link to="/profil" className="btn-secondary">
                <i className="fas fa-info-circle"></i> Tentang Kami
              </Link>
            </div>
            <div className="hero-stats">
              {heroStats.length > 0 ? (
                heroStats.map((stat, idx) => (
                  <div className="stat-item" key={stat.id || idx}>
                    <div className="stat-number">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))
              ) : (
                <div className="stat-item">
                  <div className="stat-number">2002</div>
                  <div className="stat-label">Tahun Berdiri</div>
                </div>
              )}
            </div>
          </div>
          <div className="hero-right animate-on-scroll">
            <div className="hero-visual">
              <div className="hero-visual-glow"></div>
              <div className="hero-visual-ornament"></div>
              <div className="hero-visual-card">
                <img 
                  src={formatImageUrl("logo.webp")} 
                  alt="Logo Yayasan Pesantren Ahlus-Shafa Wal-Wafa" 
                  className="hero-logo-img"
                  width="200" 
                  height="200"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NILAI & VISI */}
      <section className="nilai" id="nilai">
        <div className="section-container">
          <div className="nilai-grid">
            <div className="nilai-left animate-on-scroll">
              <div className="section-badge">{settings.nilai_badge || "Makna & Nilai"}</div>
              <div className="section-divider"></div>
              <h2 className="section-title">{settings.nilai_title || "Ahlus-Shafa Wal-Wafa"}</h2>
              <p className="section-subtitle" style={{ color: "rgba(255,255,255,0.6)" }}>
                {settings.nilai_subtitle || "Nilai-nilai tasawuf menjadi fondasi setiap pembinaan dan program yang kami laksanakan."}
              </p>
            </div>
            <div className="nilai-cards">
              {nilaiList.map((n, idx) => (
                <div className="nilai-card animate-on-scroll" style={{ transitionDelay: `${idx * 0.05 + 0.05}s` }} key={n.id || idx}>
                  <div className="nilai-card-icon">
                    <i className={n.icon || "fas fa-star"}></i>
                  </div>
                  <div className="nilai-card-title">{n.title}</div>
                  <p className="nilai-card-desc">{n.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KEGIATAN */}
      <section className="kegiatan" id="kegiatan">
        <div className="section-container">
          <div className="kegiatan-header">
            <div>
              <div className="section-badge">{settings.kegiatan_badge || "Kegiatan Kami"}</div>
              <div className="section-divider"></div>
              <h2 className="section-title" dangerouslySetInnerHTML={{ __html: (settings.kegiatan_title || "Majelis Spiritual &\nPengabdian Masyarakat").replace(/\n/g, "<br/>") }}></h2>
            </div>
            <p className="section-subtitle" style={{ maxWidth: "340px" }}>
              {settings.kegiatan_subtitle || "Jadwal kajian rutin dan kegiatan sosial kemanusiaan."}
            </p>
          </div>
          <div className="kegiatan-grid" id="kegiatanGrid" ref={kegiatanGridRef}>
            {kegiatanList.map((k, idx) => {
              const hasImage = !!k.image_path;
              return (
                <div className="kegiatan-card animate-on-scroll" style={{ transitionDelay: `${(idx % 3) * 0.05}s` }} key={k.id || idx}>
                  <div className={`kegiatan-card-icon ${k.bg_class || "kc-1"}`} style={hasImage ? { padding: 0, overflow: "hidden" } : {}}>
                    {hasImage ? (
                      <>
                        <img 
                          src={formatImageUrl(k.image_path)} 
                          alt={k.title} 
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <span className="kc-badge" style={{ position: "absolute" }}>{k.badge}</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: "60px", position: "relative", zIndex: 1 }}>{k.emoji || "🕌"}</span>
                        <span className="kc-badge">{k.badge}</span>
                      </>
                    )}
                  </div>
                  <div className="kegiatan-card-body">
                    <h3 className="kegiatan-card-title">{k.title}</h3>
                    <p className="kegiatan-card-desc">{k.desc}</p>
                    <div className="kegiatan-card-schedule">
                      <i className="fas fa-clock"></i> {k.jadwal}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ARTIKEL */}
      <section className="artikel-section" id="artikel">
        <div className="section-container">
          <div className="kegiatan-header">
            <div>
              <div className="section-badge">{settings.artikel_badge || "Kajian & Artikel"}</div>
              <div className="section-divider"></div>
              <h2 className="section-title" dangerouslySetInnerHTML={{ __html: (settings.artikel_title || "Kumpulan Artikel &\nUntaian Nasihat Ruhani").replace(/\n/g, "<br/>") }}></h2>
            </div>
            <p className="section-subtitle" style={{ maxWidth: "340px" }}>
              {settings.artikel_subtitle || "Kajian rohani tasawuf dan berita yayasan pesantren."}
            </p>
          </div>
          
          <div className="artikel-grid" id="artikelGrid" ref={artikelGridRef}>
            {artikelList.map((art, idx) => (
              <div className="artikel-card animate-on-scroll" style={{ transitionDelay: `${(idx % 3) * 0.1}s` }} key={art.id || idx}>
                <div className="artikel-image">
                  {art.gambar_path ? (
                    <img 
                      src={formatImageUrl(art.gambar_path)} 
                      alt={art.judul} 
                      loading="lazy" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,var(--green-dark),var(--green-mid))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fas fa-newspaper" style={{ fontSize: "48px", color: "rgba(255,255,255,0.2)" }}></i>
                    </div>
                  )}
                  {art.tag && <span className="artikel-tag">{art.tag}</span>}
                </div>
                <div className="artikel-body">
                  <div className="artikel-meta">
                    {art.tanggal && (
                      <span>
                        <i className="far fa-calendar-alt"></i>{" "}
                        {new Date(art.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    )}
                    {art.penulis && (
                      <span>
                        <i className="far fa-user"></i> {art.penulis}
                      </span>
                    )}
                  </div>
                  <h3 className="artikel-title">{art.judul}</h3>
                  <p className="artikel-excerpt">{art.excerpt}</p>
                  <button 
                    className="btn-read-more" 
                    onClick={() => {
                      setActiveArticle(art);
                      document.body.style.overflow = "hidden";
                    }}
                  >
                    Baca Selengkapnya <i class="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center animate-on-scroll" style={{ marginTop: "40px" }}>
            <Link to="/artikel" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Lihat Selengkapnya <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* GALERI DOKUMENTASI */}
      <section className="galeri-section-dashboard" id="galeri-dashboard" style={{ background: "var(--cream)", padding: "80px 0" }}>
        <div className="section-container">
          <div className="kegiatan-header" style={{ marginBottom: "40px" }}>
            <div>
              <div className="section-badge">{settings.galeri_badge || "Galeri Dokumentasi"}</div>
              <div className="section-divider"></div>
              <h2 className="section-title" style={{ color: "var(--green-dark)" }}>{settings.galeri_title || "Dokumentasi Kegiatan"}</h2>
            </div>
            <p className="section-subtitle" style={{ maxWidth: "380px", color: "var(--text-muted)" }}>
              {settings.galeri_subtitle || "Foto-foto dokumentasi majelis sholawat dan aksi sosial."}
            </p>
          </div>

          <div className="kegiatan-grid" id="galleryGrid" ref={galleryGridRef}>
            {galeriList.map((gal) => {
              const thumbnail = gal.photos?.find(p => p.is_thumbnail) || gal.photos?.[0];
              const totalPhotos = gal.photos?.length || 0;
              const thumbUrl = formatImageUrl(thumbnail?.image_path);

              return (
                <div className="gallery-card animate-on-scroll" onClick={() => openEventLightbox(gal)} key={gal.id}>
                  <div className="gallery-img-wrapper">
                    <img src={thumbUrl} alt={gal.title} loading="lazy" referrerPolicy="no-referrer" />
                    <div className="gallery-card-overlay">
                      <div className="gallery-card-info" style={{ textAlign: "left" }}>
                        <span className="gallery-photo-count">
                          <i className="fas fa-images"></i> {totalPhotos} Foto
                        </span>
                        <h3 className="gallery-event-title">{gal.title}</h3>
                        <p className="gallery-event-desc">
                          Lihat Dokumentasi <i className="fas fa-arrow-right"></i>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center" style={{ marginTop: "40px" }}>
            <Link to="/galeri" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Lihat Selengkapnya <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* VIDEO GALLERY */}
      <section className="video-section-dashboard" id="video-dashboard" style={{ background: "linear-gradient(180deg, #102d1f 0%, #08160f 100%)", padding: "80px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="section-container">
          <div className="kegiatan-header" style={{ marginBottom: "40px" }}>
            <div>
              <div className="section-badge" style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold-light)", borderColor: "rgba(201,168,76,0.3)" }}>
                {settings.video_badge || "Galeri Video"}
              </div>
              <div className="section-divider"></div>
              <h2 className="section-title" style={{ color: "#fff" }}>{settings.video_title || "Kanal Video Utama"}</h2>
            </div>
            <p className="section-subtitle" style={{ maxWidth: "380px", color: "rgba(255,255,255,0.7)" }}>
              {settings.video_subtitle || "Tonton video kajian rohani dan sholawat secara langsung."}
            </p>
          </div>

          <div className="kegiatan-grid" id="videoGrid" ref={videoGridRef}>
            {videoList.map((video) => (
              <div className="video-slider-card" onClick={() => openVideoPlayer(video.youtube_id)} key={video.id}>
                <div className="video-img-wrapper">
                  <img 
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} 
                    alt={video.title} 
                    loading="lazy" 
                  />
                  <div className="video-card-overlay">
                    <div className="video-play-btn-circle">
                      <i className="fas fa-play"></i>
                    </div>
                    <div className="video-card-info">
                      <h3 className="video-card-title">{video.title}</h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center" style={{ marginTop: "40px" }}>
            <Link to="/galeri?tab=video" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
              Kunjungi Galeri Video <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* LOKASI */}
      <section className="lokasi" id="lokasi">
        <div className="section-container">
          <div className="lokasi-grid">
            <div className="animate-on-scroll">
              <div className="section-badge">{settings.lokasi_badge || "Lokasi Kami"}</div>
              <div className="section-divider"></div>
              <h2 className="section-title">{settings.lokasi_title || "Temukan Kami"}</h2>
              <p className="section-subtitle">
                {settings.lokasi_subtitle || "Hadir dan bergabunglah bersama ribuan jamaah kami."}
              </p>
              
              <div className="lokasi-detail">
                <div className="lokasi-item">
                  <div className="lokasi-item-icon">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div className="lokasi-item-text">
                    <strong>Alamat Lengkap</strong>
                    <span dangerouslySetInnerHTML={{ __html: (settings.lokasi_alamat || "Jl. Darmo No. 01 Simoketawang, Wonoayu, Sidoarjo").replace(/\n/g, "<br/>") }}></span>
                  </div>
                </div>
                <div className="lokasi-item">
                  <div className="lokasi-item-icon">
                    <i className="fas fa-mosque"></i>
                  </div>
                  <div className="lokasi-item-text">
                    <strong>Jenis Lembaga</strong>
                    <span>{settings.lokasi_jenis || "Pesantren Tarekat"}</span>
                  </div>
                </div>
                <div className="lokasi-item">
                  <div className="lokasi-item-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="lokasi-item-text">
                    <strong>Kegiatan Terbuka</strong>
                    <span>{settings.lokasi_kegiatan_terbuka || "Majelis Reboan Agung"}</span>
                  </div>
                </div>
              </div>

              <div className="lokasi-socials">
                {sosialList.map((s, idx) => (
                  <a 
                    href={s.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link" 
                    title={s.platform}
                    style={s.color ? { color: s.color, borderColor: `${s.color}33` } : {}}
                    key={s.id || idx}
                  >
                    <i className={s.icon || "fas fa-link"}></i>
                  </a>
                ))}
              </div>
            </div>

            <div className="animate-on-scroll" style={{ transitionDelay: "0.15s" }}>
              <div className="map-container">
                <iframe
                  src={settings.lokasi_maps_embed_url || "https://www.google.com/maps/embed?pb=..."}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokasi PP. Ahlus Shofa Wal Wafa"
                ></iframe>
                <a 
                  href={settings.lokasi_maps_link || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="map-open-btn"
                >
                  <i className="fas fa-directions"></i> Petunjuk Arah
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARTICLE READ MODAL */}
      {activeArticle && (
        <div className="article-modal open" id="articleModal">
          <div className="article-modal-overlay" onClick={() => { setActiveArticle(null); document.body.style.overflow = ""; }}></div>
          <div className="article-modal-content">
            <button className="article-modal-close" onClick={() => { setActiveArticle(null); document.body.style.overflow = ""; }}>
              <i className="fas fa-times"></i>
            </button>
            <div className="article-modal-body">
              <h2>{activeArticle.judul}</h2>
              <div className="meta">
                {activeArticle.tanggal && (
                  <span>
                    <i className="far fa-calendar-alt"></i>{" "}
                    {new Date(activeArticle.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                {activeArticle.penulis && (
                  <span>
                    <i className="far fa-user"></i> {activeArticle.penulis}
                  </span>
                )}
              </div>
              <div className="article-content-text" dangerouslySetInnerHTML={{ __html: activeArticle.konten }} />
            </div>
          </div>
        </div>
      )}

      {/* YOUTUBE LIGHTBOX */}
      {activeVideoId && (
        <div className="video-lightbox active" id="videoLightbox">
          <div className="video-lightbox-overlay" onClick={closeVideoPlayer}></div>
          <div className="video-lightbox-container">
            <button className="video-lightbox-close" onClick={closeVideoPlayer}>
              <i className="fas fa-times"></i>
            </button>
            <div className="video-lightbox-body">
              <div className="video-lightbox-iframe-wrapper">
                <iframe
                  id="videoPlayerIframe"
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title="Youtube Video Player"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO MODAL LIGHTBOX (AR-ROHMAH STYLE) */}
      {activeEvent && (
        <div className={`event-lightbox open ${zoomScale > 1 ? "is-zoomed" : ""}`} id="eventLightbox">
          <div className="event-lightbox-overlay" onClick={closeEventLightbox}></div>
          <div className={`event-lightbox-container ${zoomScale > 1 ? "is-zoomed" : ""}`}>
            {/* Top Right Close Button */}
            <div className="event-lightbox-header">
              <button className="event-lightbox-close" onClick={closeEventLightbox} title="Tutup">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Photo Card Viewport */}
            <div className="event-lightbox-main">
              {activeEvent.photos.length > 1 && (
                <button className="event-lightbox-prev" onClick={prevEventImage} title="Sebelumnya">
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              
              <div 
                className="event-lightbox-image-wrapper"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
              >
                <img 
                  ref={imgRef}
                  src={formatImageUrl(activeEvent.photos[activePhotoIdx]?.image_path)} 
                  alt={activeEvent.title}
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `scale(${zoomScale}) translate(${panPosition.x / zoomScale}px, ${panPosition.y / zoomScale}px)`,
                    cursor: zoomScale > 1 ? "grab" : "default",
                    transition: isDragging ? "none" : "transform 0.25s ease"
                  }}
                />
              </div>

              {activeEvent.photos.length > 1 && (
                <button className="event-lightbox-next" onClick={nextEventImage} title="Berikutnya">
                  <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>

            {/* Centered Title & Description Under Photo */}
            <div className="event-lightbox-footer">
              <h4 className="event-lightbox-desc">
                {activeEvent.photos[activePhotoIdx]?.caption || activeEvent.title}
              </h4>
              {activeEvent.description && (
                <p className="event-lightbox-subdesc">
                  {activeEvent.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
