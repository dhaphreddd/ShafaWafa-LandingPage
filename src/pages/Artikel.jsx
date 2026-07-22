import React, { useState, useEffect } from "react";
import { getCollectionData } from "../firebase";
import { formatImageUrl } from "../utils/imageHelper";

export default function Artikel() {
  const [artikelList, setArtikelList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticle, setActiveArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    async function loadData() {
      const articles = await getCollectionData("artikels", "landing_artikels");
      setArtikelList(articles.filter(item => item.is_active !== false));
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
  }, [artikelList, searchQuery, currentPage]);

  // Filtering articles based on query
  const filteredArticles = artikelList.filter((art) => {
    const query = searchQuery.toLowerCase();
    return (
      art.judul.toLowerCase().includes(query) ||
      (art.excerpt && art.excerpt.toLowerCase().includes(query)) ||
      (art.tag && art.tag.toLowerCase().includes(query))
    );
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="artikel-root" style={{ paddingTop: "100px" }}>
      <section className="artikel-section" id="artikel">
        <div className="section-container">
          <div className="kegiatan-header" style={{ marginBottom: "20px" }}>
            <div>
              <div className="section-badge">Kajian &amp; Artikel</div>
              <div className="section-divider"></div>
              <h2 className="section-title">Kumpulan Artikel &amp;<br />Untaian Nasihat Ruhani</h2>
            </div>
            <p className="section-subtitle" style={{ maxWidth: "340px" }}>
              Tulisan bermanfaat seputar ajaran tasawuf, penataan hati, akhlak mulia, dan kabar perkembangan kegiatan pesantren.
            </p>
          </div>

          {/* SEARCH BAR */}
          <div style={{ marginBottom: "40px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
              <input
                type="text"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // reset to first page on search
                }}
                style={{
                  width: "100%",
                  padding: "12px 20px 12px 45px",
                  borderRadius: "50px",
                  border: "1px solid rgba(13, 43, 30, 0.15)",
                  background: "#fff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  outline: "none",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
                }}
              />
              <i 
                className="fas fa-search" 
                style={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--green-light)",
                  fontSize: "15px"
                }}
              ></i>
            </div>
          </div>
          
          <div className="artikel-grid">
            {paginatedArticles.map((art, idx) => (
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
                    Baca Selengkapnya <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            ))}
            
            {filteredArticles.length === 0 && (
              <p style={{ color: "var(--text-muted)", textAlign: "center", width: "100%", gridColumn: "1 / -1", padding: "40px 0" }}>
                Tidak ada artikel yang cocok dengan pencarian Anda.
              </p>
            )}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="custom-pagination">
              <ul className="pagination" style={{ display: "flex", justifyContent: "center", gap: "8px", listStyle: "none", padding: 0, marginTop: "40px" }}>
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="page-link"
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(13, 43, 30, 0.1)",
                      width: "40px", height: "40px", borderRadius: "8px",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button
                      onClick={() => handlePageChange(i + 1)}
                      className="page-link"
                      style={{
                        background: currentPage === i + 1 ? "var(--green-dark)" : "#fff",
                        color: currentPage === i + 1 ? "#fff" : "var(--green-dark)",
                        border: "1px solid rgba(13, 43, 30, 0.1)",
                        width: "40px", height: "40px", borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="page-link"
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(13, 43, 30, 0.1)",
                      width: "40px", height: "40px", borderRadius: "8px",
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                    }}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </div>
          )}
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
    </div>
  );
}
