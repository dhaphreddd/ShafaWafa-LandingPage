import React, { useState, useEffect } from "react";
import { getCollectionData } from "../firebase";
import { formatImageUrl } from "../utils/imageHelper";

export default function Kegiatan() {
  const [kegiatanList, setKegiatanList] = useState([]);

  useEffect(() => {
    async function loadData() {
      const kegiatans = await getCollectionData("kegiatans", "landing_kegiatans");
      setKegiatanList(kegiatans.filter(item => item.is_active !== false));
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
  }, [kegiatanList]);

  return (
    <div className="kegiatan-root" style={{ paddingTop: "100px" }}>
      <section className="kegiatan" id="kegiatan">
        <div className="section-container">
          <div className="kegiatan-header">
            <div>
              <div className="section-badge">Kegiatan Kami</div>
              <div className="section-divider"></div>
              <h2 className="section-title">Majelis Spiritual &amp;<br />Pengabdian Masyarakat</h2>
            </div>
            <p className="section-subtitle" style={{ maxWidth: "340px" }}>
              Berbagai kegiatan rutin dan tahunan yang diselenggarakan untuk membina jamaah secara rohani dan sosial.
            </p>
          </div>
          <div className="kegiatan-grid">
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
                    <div className="kegiatan-card-schedule"><i className="fas fa-clock"></i> {k.jadwal}</div>
                  </div>
                </div>
              );
            })}
            {kegiatanList.length === 0 && (
              <p className="text-muted" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                Belum ada kegiatan yang dipublikasikan.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
