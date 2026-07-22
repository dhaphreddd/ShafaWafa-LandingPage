import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getCollectionData } from "../firebase";
import { formatImageUrl } from "../utils/imageHelper";

export default function Galeri() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("photo");
  const [galeriList, setGaleriList] = useState([]);
  const [videoList, setVideoList] = useState([]);

  // Modals & Lightbox states
  const [activeEvent, setActiveEvent] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeVideoId, setActiveVideoId] = useState(null);

  // Zoom / Pan states
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  useEffect(() => {
    // Parse tab parameter from URL
    const tabParam = searchParams.get("tab");
    if (tabParam === "video") {
      setActiveTab("video");
    } else {
      setActiveTab("photo");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      const galleries = await getCollectionData("galeriEvents", "landing_galeri_events");
      const videos = await getCollectionData("videos", "landing_videos");

      setGaleriList(galleries.filter(item => item.is_active !== false));
      setVideoList(videos.filter(item => item.is_active !== false));
    }
    loadData();
  }, []);

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
  }, [galeriList, videoList, activeTab, activeEvent, activeVideoId]);

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
    setActivePhoto(event.photos[0]);
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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeEvent, activeVideoId]);

  return (
    <div className="galeri-root" style={{ paddingTop: "100px" }}>
      <section className="galeri-section" id="galeri">
        <div className="section-container">
          <div className="text-center mb-4 animate-on-scroll" style={{ textAlign: "center", marginBottom: "30px" }}>
            <div className="section-badge">Galeri Dokumentasi</div>
            <div className="section-divider" style={{ margin: "12px auto 20px" }}></div>
            <h2 className="section-title">Galeri Kegiatan</h2>
            <p className="section-subtitle text-muted mt-2" style={{ margin: "0 auto" }}>
              Lihat dan tonton dokumentasi seluruh kegiatan rohani dan sosial Yayasan Pesantren.
            </p>
          </div>

          {/* TAB TOGGLER */}
          <div className="gallery-tabs-wrapper animate-on-scroll">
            <button 
              className={`gallery-tab-btn ${activeTab === "photo" ? "active" : ""}`} 
              onClick={() => setActiveTab("photo")}
            >
              <i className="fas fa-images"></i> Galeri Foto
            </button>
            <button 
              className={`gallery-tab-btn ${activeTab === "video" ? "active" : ""}`} 
              onClick={() => setActiveTab("video")}
            >
              <i className="fas fa-video"></i> Galeri Video
            </button>
          </div>

          {/* PHOTO GALLERY CONTENT */}
          <div id="photo-gallery-content" className={`gallery-tab-content ${activeTab === "photo" ? "active" : ""}`}>
            <div className="gallery-grid animate-on-scroll">
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
              {galeriList.length === 0 && (
                <p style={{ color: "var(--text-muted)", textAlign: "center", width: "100%", gridColumn: "1 / -1", padding: "40px 0" }}>
                  Belum ada foto galeri.
                </p>
              )}
            </div>
          </div>

          {/* VIDEO GALLERY CONTENT */}
          <div id="video-gallery-content" className={`gallery-tab-content ${activeTab === "video" ? "active" : ""}`}>
            <div className="video-gallery-grid animate-on-scroll">
              {videoList.map((video) => (
                <div className="video-card animate-on-scroll" onClick={() => openVideoPlayer(video.youtube_id)} key={video.id}>
                  <div className="video-img-wrapper-page">
                    <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt={video.title} loading="lazy" />
                    <div className="video-card-overlay-page">
                      <div className="video-play-btn-circle-page">
                        <i className="fas fa-play"></i>
                      </div>
                      <div className="video-card-info-page">
                        <h3 className="video-card-title-page">{video.title}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {videoList.length === 0 && (
                <p style={{ color: "var(--text-muted)", textAlign: "center", width: "100%", gridColumn: "1 / -1", padding: "40px 0" }}>
                  Belum ada video.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

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
