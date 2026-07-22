import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

export default function Layout({ children, settings }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    document.body.style.overflow = "";
    // Scroll to top on navigation (except when hash is present)
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Handle hash scrolling on page load/navigate
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location.hash, location.pathname]);

  const toggleMobileMenu = () => {
    const nextState = !mobileMenuOpen;
    setMobileMenuOpen(nextState);
    if (nextState) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  };

  const handleDropdownItemClick = (hash) => {
    if (location.pathname !== "/profil") {
      navigate(`/profil${hash}`);
    } else {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setDropdownOpen(false);
  };

  return (
    <div className="layout-root">
      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`} id="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <img 
              src="/storage/logo-sm.webp" 
              alt="Logo Yayasan Pesantren Ahlus-Shafa Wal-Wafa" 
              className="nav-logo-img" 
              width="46" 
              height="46"
            />
            <div className="nav-brand-text">
              <span className="nav-brand-name">Ahlus-Shafa Wal-Wafa</span>
              <span className="nav-brand-sub">Simoketawang · Sidoarjo</span>
            </div>
          </Link>
          
          {/* Desktop Nav Links */}
          <ul className="nav-links" id="navLinks">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
                Beranda
              </NavLink>
            </li>
            <li 
              className="dropdown" 
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <NavLink 
                to="/profil" 
                className={({ isActive }) => `nav-dropdown-toggle ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/profil");
                }}
              >
                Profil <i className="fas fa-chevron-down"></i>
              </NavLink>
              <ul className={`dropdown-menu ${dropdownOpen ? "open" : ""}`} style={{ display: dropdownOpen ? "block" : "none" }}>
                <li>
                  <a href="#/profil#sejarah" onClick={(e) => { e.preventDefault(); handleDropdownItemClick("#sejarah"); }}>
                    Sejarah
                  </a>
                </li>
                <li>
                  <a href="#/profil#visi-misi" onClick={(e) => { e.preventDefault(); handleDropdownItemClick("#visi-misi"); }}>
                    Visi Misi
                  </a>
                </li>
                <li>
                  <a href="#/profil#biografi-pengasuh" onClick={(e) => { e.preventDefault(); handleDropdownItemClick("#biografi-pengasuh"); }}>
                    Biografi Pengasuh
                  </a>
                </li>
                <li>
                  <a href="#/profil#struktur-organisasi" onClick={(e) => { e.preventDefault(); handleDropdownItemClick("#struktur-organisasi"); }}>
                    Struktur Organisasi
                  </a>
                </li>
              </ul>
            </li>
            <li>
              <NavLink to="/kegiatan" className={({ isActive }) => isActive ? "active" : ""}>
                Kegiatan
              </NavLink>
            </li>
            <li>
              <NavLink to="/artikel" className={({ isActive }) => isActive ? "active" : ""}>
                Artikel
              </NavLink>
            </li>
            <li>
              <NavLink to="/galeri" className={({ isActive }) => isActive ? "active" : ""}>
                Galeri
              </NavLink>
            </li>
          </ul>

          <button 
            className={`hamburger ${mobileMenuOpen ? "active" : ""}`} 
            id="hamburger" 
            onClick={toggleMobileMenu} 
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? "open" : ""}`} 
        id="menuOverlay" 
        onClick={toggleMobileMenu}
      ></div>
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`} id="mobileMenu">
        <div className="mobile-menu-group">
          <Link to="/" onClick={toggleMobileMenu}>
            <i className="fas fa-home"></i> Beranda
          </Link>
          <Link to="/profil" onClick={toggleMobileMenu}>
            <i className="fas fa-info-circle"></i> Profil Yayasan
          </Link>
          <Link to="/kegiatan" onClick={toggleMobileMenu}>
            <i className="fas fa-calendar-alt"></i> Kegiatan
          </Link>
          <Link to="/artikel" onClick={toggleMobileMenu}>
            <i className="fas fa-newspaper"></i> Artikel / Berita
          </Link>
          <Link to="/galeri" onClick={toggleMobileMenu}>
            <i className="fas fa-images"></i> Galeri
          </Link>
        </div>
        <div className="mobile-menu-group">
          <span className="mobile-menu-header">Panel Administrasi</span>
          <Link to="/admin" onClick={toggleMobileMenu}>
            <i className="fas fa-user-shield"></i> Login Admin / CMS
          </Link>
        </div>
      </div>

      <main>{children}</main>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img 
                src="/storage/logo-sm.webp" 
                alt="Logo" 
                className="footer-logo-img" 
                width="44" 
                height="44" 
                loading="lazy"
              />
              <div className="footer-logo-text">
                Ahlus-Shafa Wal-Wafa
                <small>Simoketawang · Wonoayu · Sidoarjo</small>
              </div>
            </div>
            <p>
              Yayasan Pesantren Tarekat yang berdedikasi pada pembinaan hati melalui tasawuf, pengabdian sosial, dan harmoni antar umat sejak tahun 2002.
            </p>
          </div>
          <div>
            <div className="footer-h">Navigasi</div>
            <ul className="footer-links">
              <li><Link to="/profil">Profil Yayasan</Link></li>
              <li><Link to="/kegiatan">Kegiatan</Link></li>
              <li><Link to="/artikel">Artikel</Link></li>
              <li><Link to="/galeri">Galeri</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-h">Akses SIMAYA</div>
            <ul className="footer-links">
              <li><Link to="/admin">CMS Panel Admin</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-h">Ikuti Kami</div>
            <ul className="footer-links">
              <li>
                <a href={settings.sosial_instagram || "https://www.instagram.com/ahlusshafa_walwafa/"} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram" style={{ width: "16px" }}></i> Instagram
                </a>
              </li>
              <li>
                <a href={settings.sosial_youtube || "https://www.youtube.com/channel/UCJFsTPOTUEcMisoNbk2GvUw"} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-youtube" style={{ width: "16px" }}></i> YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2002–2026 Yayasan Pesantren Ahlus-Shafa Wal-Wafa. Semua hak dilindungi.</span>
          <span>Dikelola dengan <strong>SIMAYA Static</strong> · <Link to="/admin">Sistem Manajemen Yayasan</Link></span>
        </div>
      </footer>
    </div>
  );
}
