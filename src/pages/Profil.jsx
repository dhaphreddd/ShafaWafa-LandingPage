import React, { useState, useEffect } from "react";
import { getSiteSettings, getCollectionData } from "../firebase";

export default function Profil({ settings }) {
  const [misiList, setMisiList] = useState([]);
  const [sejarahList, setSejarahList] = useState([]);
  const [strukturList, setStrukturList] = useState([]);
  const [featureList, setFeatureList] = useState([]);

  useEffect(() => {
    async function loadData() {
      const misis = await getCollectionData("misis", "landing_misis");
      const sejarahs = await getCollectionData("sejarahs", "landing_sejarahs");
      const strukturs = await getCollectionData("strukturs", "landing_strukturs");
      const features = await getCollectionData("tentangFeatures", "landing_tentang_features");

      setMisiList(misis.sort((a, b) => a.urutan - b.urutan));
      setSejarahList(sejarahs.filter(item => item.is_active !== false).sort((a, b) => a.urutan - b.urutan));
      setStrukturList(strukturs.filter(item => item.is_active !== false).sort((a, b) => a.urutan - b.urutan));
      setFeatureList(features.filter(item => item.is_active !== false).sort((a, b) => a.urutan - b.urutan));
    }
    loadData();
  }, []);

  // Intersection Observer for scroll animations
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
  }, [misiList, sejarahList, strukturList, featureList]);

  // Group structure members by level
  const groupedStruktur = strukturList.reduce((acc, member) => {
    const level = member.level || 0;
    if (!acc[level]) acc[level] = [];
    acc[level].push(member);
    return acc;
  }, {});

  return (
    <div className="profil-root" style={{ paddingTop: "100px" }}>
      {/* BIOGRAFI PENGASUH */}
      <section className="biografi" id="biografi-pengasuh">
        <div className="section-container">
          <div className="biografi-grid">
            <div className="biografi-left animate-on-scroll">
              <div className="section-badge">Pengasuh Pesantren</div>
              <div className="section-divider"></div>
              <h2 className="section-title">Biografi Mursyid &amp;<br />Pembimbing Spiritual</h2>
              <div className="biografi-content mt-4">
                <h3>{settings.biografi_nama || "KH. Mohammad Nizam As-Shofa"}</h3>
                <p className="biografi-title-sub">{settings.biografi_jabatan || "Mursyid Thariqah & Pendiri Yayasan"}</p>
                <p className="mt-3">{settings.biografi_paragraf_1}</p>
                <p>{settings.biografi_paragraf_2}</p>
                <p>{settings.biografi_paragraf_3}</p>
              </div>
            </div>
            <div className="biografi-right animate-on-scroll" style={{ transitionDelay: "0.15s" }}>
              <div className="biografi-card">
                <div className="biografi-img-frame">
                  <img src="/storage/gallery/abi.jpg" alt={settings.biografi_panggilan || "Buya As-Shafa"} loading="lazy" />
                </div>
                <div className="biografi-card-body text-center">
                  <div className="biografi-name">{settings.biografi_nama || "KH. Mohammad Nizam As-Shofa"}</div>
                  <div className="biografi-role">{settings.biografi_panggilan || "Buya As-Shafa"}</div>
                  <div className="biografi-quote">"{settings.biografi_quote || "Membersihkan hati, menepati janji."}"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISI & MISI */}
      <section className="visi-misi" id="visi-misi">
        <div className="section-container">
          <div className="visi-misi-grid">
            <div className="animate-on-scroll">
              <div className="section-badge">Visi Yayasan</div>
              <div className="section-divider"></div>
              <div className="visi-card mt-4">
                <p className="visi-text">
                  {settings.visi_teks || "Menjadi pusat pembinaan spiritual bertaraf internasional."}
                </p>
              </div>
            </div>
            <div className="animate-on-scroll" style={{ transitionDelay: "0.1s" }}>
              <div className="section-badge">Misi Yayasan</div>
              <div className="section-divider"></div>
              <div className="misi-container mt-4">
                {misiList.map((m, idx) => (
                  <div className="misi-card" key={m.id || idx}>
                    <div className="misi-num">{idx + 1}</div>
                    <p className="misi-content">{m.misi_text}</p>
                  </div>
                ))}
                {misiList.length === 0 && (
                  <p className="text-muted">Misi yayasan sedang diperbarui.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEJARAH TIMELINE */}
      <section className="tentang" id="sejarah">
        <div className="section-container">
          <div className="tentang-grid">
            <div className="tentang-visual animate-on-scroll">
              <div className="tentang-card-main">
                <div className="tentang-year">2002</div>
                <div className="tentang-card-label">Pengasuh Pesantren</div>
                <div className="tentang-card-name">{settings.tentang_nama_pengasuh || "KH. Mohammad Nizam As-Shofa"}</div>
                <div className="tentang-card-role">{settings.tentang_peran_pengasuh || "Buya As-Shafa · Mursyid & Pembimbing Spiritual"}</div>
                <blockquote className="tentang-card-quote">
                  "{settings.tentang_quote || "Membersihkan hati menuju keikhlasan."}"
                </blockquote>
              </div>
              <div className="tentang-badge-float">
                Berdiri 2002 <small>Wonoayu, Sidoarjo</small>
              </div>
            </div>
            <div className="tentang-content animate-on-scroll" style={{ transitionDelay: "0.15s" }}>
              <div className="section-badge">Sejarah &amp; Profil</div>
              <div className="section-divider"></div>
              <h2 className="section-title">Pusat Pendidikan Islam:<br />Penataan Hati &amp; Akhlak Mulia</h2>
              <p>{settings.tentang_paragraf_1}</p>
              <p>{settings.tentang_paragraf_2}</p>
              <p>{settings.tentang_paragraf_3}</p>
              <div className="tentang-features">
                {featureList.map((f, idx) => (
                  <div className="tentang-feature" key={f.id || idx}>
                    <div className="feature-icon"><i className={f.icon || "fas fa-star"}></i></div>
                    <div className="feature-text">
                      <strong>{f.title}</strong>
                      <span>{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VERTICAL TIMELINE */}
          <div className="sejarah-timeline mt-5 pt-5 animate-on-scroll">
            <h3 className="timeline-main-title text-center mb-5" style={{ marginBottom: "40px" }}>Garis Waktu Perjalanan Yayasan</h3>
            <div className="timeline-container">
              <div className="timeline-line"></div>
              {sejarahList.map((item, idx) => {
                const direction = idx % 2 === 0 ? "left" : "right";
                return (
                  <div className={`timeline-item ${direction}`} key={item.id || idx}>
                    <div className="timeline-badge">
                      <i className="fas fa-mosque"></i>
                    </div>
                    <div className="timeline-card">
                      <div className="timeline-year">{item.tahun}</div>
                      <h4 className="timeline-title">{item.judul}</h4>
                      <p className="timeline-desc">{item.deskripsi}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* STRUKTUR ORGANISASI */}
      <section className="struktur" id="struktur-organisasi">
        <div className="section-container">
          <div className="text-center mb-5 animate-on-scroll" style={{ marginBottom: "40px" }}>
            <div className="section-badge">Manajemen Yayasan</div>
            <div className="section-divider" style={{ margin: "12px auto 20px" }}></div>
            <h2 className="section-title">Struktur Organisasi Yayasan</h2>
            <p className="section-subtitle" style={{ margin: "0 auto", maxWidth: "580px" }}>
              Struktur kepengurusan resmi Yayasan Pesantren Ahlus-Shafa Wal-Wafa yang bertanggung jawab atas pengelolaan operasional, spiritual, dan program sosial.
            </p>
          </div>
          
          <div className="org-chart animate-on-scroll">
            {Object.keys(groupedStruktur).sort().map((level, levelIdx) => {
              const members = groupedStruktur[level];
              return (
                <React.Fragment key={level}>
                  {levelIdx > 0 && <div className="org-connector-v"></div>}
                  <div className={`org-level level-${level}`}>
                    {members.map((m, idx) => (
                      <div className={`org-node ${m.tipe || "department"}`} key={m.id || idx}>
                        <div className="node-badge">{m.jabatan}</div>
                        {m.nama && <div className="node-name">{m.nama}</div>}
                        {m.deskripsi && <div className="node-desc">{m.deskripsi}</div>}
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
