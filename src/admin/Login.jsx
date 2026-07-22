import React, { useState, useEffect } from "react";
import MosqueScene from "./MosqueScene";
import { useNavigate, Link } from "react-router-dom";
import { auth, isFirebaseConfigured } from "../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { formatImageUrl } from "../utils/imageHelper";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  // Skip 3D rendering entirely on mobile/tablet (< 992px)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 992);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 991px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
      setDateStr(now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).toUpperCase());
    };
    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (auth) {
      const unsub = onAuthStateChanged(auth, (u) => { if (u) navigate("/admin/dashboard"); });
      return unsub;
    }
  }, [navigate]);

  // Three.js scene is now handled by the separate MosqueScene component.

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) {
      setError("Firebase is not fully configured. Please configure your .env file.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Email atau password salah, atau gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "row", overflow: "hidden" }}>
      {!isMobile && (
        <MosqueScene timeStr={timeStr} dateStr={dateStr} />
      )}

      {/* ── RIGHT PANEL: LOGIN FORM ── */}
      <div style={{
        width: isMobile ? "100%" : "460px",
        maxWidth: isMobile ? "100%" : "460px",
        minHeight: "100vh",
        background: isMobile
          ? "linear-gradient(165deg, #0a1a12 0%, #0d1a29 40%, #1a1018 100%)"
          : "rgba(6, 18, 12, 0.98)",
        backdropFilter: isMobile ? "none" : "blur(20px)",
        borderLeft: isMobile ? "none" : "1px solid rgba(201,168,76,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px", position: "relative", zIndex: 2, flexShrink: 0
      }}>

        <div style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>
          <img src={formatImageUrl("logo-sm.webp")} alt="Logo Yayasan"
            style={{ width: "78px", height: "78px", borderRadius: "50%", marginBottom: "18px", border: "2.5px solid #d9a830" }} />

          <h2 style={{
            fontFamily: "Playfair Display, serif", color: "#fff",
            fontSize: "24px", fontWeight: 700, marginBottom: "6px"
          }}>Selamat Datang</h2>

          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", marginBottom: "32px", letterSpacing: "0.4px" }}>
            Masuk ke Panel Administrasi SIMAYA
          </p>

          {!isFirebaseConfigured && (
            <div style={{
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)",
              borderRadius: "10px", padding: "12px", color: "#f87171",
              fontSize: "12px", lineHeight: 1.5, marginBottom: "18px", textAlign: "left"
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: "6px" }} />
              <strong>Firebase Belum Terkonfigurasi!</strong><br />
              Silakan buat file <code>.env</code> dan masukkan konfigurasi Firebase Anda.
            </div>
          )}

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)",
              borderRadius: "10px", padding: "12px", color: "#f87171",
              fontSize: "13px", marginBottom: "18px", textAlign: "left"
            }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: "6px" }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px", textAlign: "left" }}>
            <div>
              <label style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "7px" }}>
                Email Admin
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isFirebaseConfigured || loading}
                  placeholder="admin@simaya.id"
                  style={{
                    width: "100%", padding: "12px 16px 12px 42px",
                    borderRadius: "10px", border: "1px solid rgba(255,255,255,0.13)",
                    background: "rgba(0,0,0,0.22)", color: "#fff", fontSize: "14px", outline: "none"
                  }}
                />
                <i className="far fa-envelope" style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#d9a830" }} />
              </div>
            </div>

            <div>
              <label style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "7px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isFirebaseConfigured || loading}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "12px 16px 12px 42px",
                    borderRadius: "10px", border: "1px solid rgba(255,255,255,0.13)",
                    background: "rgba(0,0,0,0.22)", color: "#fff", fontSize: "14px", outline: "none"
                  }}
                />
                <i className="fas fa-lock" style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#d9a830" }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFirebaseConfigured || loading}
              style={{
                marginTop: "8px", padding: "13px",
                borderRadius: "50px", border: "none",
                background: "linear-gradient(135deg, #c9902a, #e8c055)",
                color: "#0a1a0d", fontWeight: 700, fontSize: "14px",
                cursor: (!isFirebaseConfigured || loading) ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
                opacity: (!isFirebaseConfigured || loading) ? 0.55 : 1
              }}
            >
              {loading ? "Menghubungi Firebase..." : "MASUK SEKARANG"}
            </button>
          </form>

          <div style={{ marginTop: "28px" }}>
            <Link to="/" style={{ color: "#d9a830", fontSize: "13px", textDecoration: "none" }}>
              <i className="fas fa-arrow-left" style={{ marginRight: "6px" }} /> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
