import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch, getDocs } from "firebase/firestore";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) setUser(u); });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "in", [user.uid, "admin", "all"]),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return unsub;
  }, [user]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  };

  const markOneRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const getIcon = (type) => {
    switch (type) {
      case "registration": return { icon: "fas fa-clipboard-check", color: "#48cae4" };
      case "donation": return { icon: "fas fa-hand-holding-heart", color: "#e8c96e" };
      default: return { icon: "fas fa-bell", color: "#64ffda" };
    }
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Baru saja";
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} jam lalu`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} hari lalu`;
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px", padding: "8px 12px", color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "8px", fontSize: "13px"
      }}>
        <i className="fas fa-bell" style={{ color: unreadCount > 0 ? "#f59e0b" : "#9ca3af" }}></i>
        {unreadCount > 0 && (
          <span style={{
            background: "#ef4444", color: "#fff", borderRadius: "50%", width: "18px", height: "18px",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700
          }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)}></div>
          <div style={{
            position: "absolute", top: "100%", right: 0, marginTop: "8px",
            width: "380px", maxHeight: "480px", overflowY: "auto",
            background: "#0e171e", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)", zIndex: 100
          }}>
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>Notifikasi</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#d9a830", fontSize: "12px", cursor: "pointer" }}>
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                <i className="fas fa-bell-slash" style={{ fontSize: "24px", marginBottom: "8px" }}></i>
                <p style={{ margin: 0, fontSize: "13px" }}>Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => {
                const { icon, color } = getIcon(n.type);
                return (
                  <div key={n.id} onClick={() => markOneRead(n.id)} style={{
                    padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer", display: "flex", gap: "12px", alignItems: "flex-start",
                    background: n.read ? "transparent" : "rgba(217,168,48,0.04)",
                    transition: "background 0.2s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(217,168,48,0.04)"}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `${color}1a`, border: `1px solid ${color}33`
                    }}>
                      <i className={icon} style={{ color, fontSize: "14px" }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: n.read ? 400 : 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {n.title}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>{formatTime(n.createdAt)}</span>
                    </div>
                    {!n.read && (
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d9a830", marginTop: "6px", flexShrink: 0 }}></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
