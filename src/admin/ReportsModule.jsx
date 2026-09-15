import React, { useState, useMemo } from "react";

export default function ReportsModule({ systemUsers, systemEvents, systemRegistrations, systemDonations }) {
  const [activeReport, setActiveReport] = useState("jamaah");

  // === JAMAAT REPORTS ===
  const jamaahStats = useMemo(() => {
    const total = systemUsers.length;
    const active = systemUsers.filter(u => u.status === "active").length;
    const inactive = systemUsers.filter(u => u.status === "nonaktif" || u.status === "inactive").length;
    const suspended = systemUsers.filter(u => u.status === "suspended").length;
    const thisMonth = systemUsers.filter(u => {
      const d = new Date(u.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const byRole = {};
    systemUsers.forEach(u => {
      const r = u.role || "member";
      byRole[r] = (byRole[r] || 0) + 1;
    });
    return { total, active, inactive, suspended, thisMonth, byRole };
  }, [systemUsers]);

  // === KEGIATAN REPORTS ===
  const kegiatanStats = useMemo(() => {
    const total = systemEvents.length;
    const active = systemEvents.filter(e => e.is_active !== false).length;
    const totalRegs = systemRegistrations.length;
    const approved = systemRegistrations.filter(r => r.status === "approved").length;
    const rejected = systemRegistrations.filter(r => r.status === "rejected").length;
    const pending = systemRegistrations.filter(r => r.status === "pending").length;
    const attended = systemRegistrations.filter(r => r.status === "attended").length;
    return { total, active, totalRegs, approved, rejected, pending, attended };
  }, [systemEvents, systemRegistrations]);

  // === DONASI REPORTS ===
  const donasiStats = useMemo(() => {
    const total = systemDonations.length;
    const verified = systemDonations.filter(d => d.status === "verified");
    const totalVerified = verified.reduce((s, d) => s + Number(d.amount || 0), 0);
    const pending = systemDonations.filter(d => d.status === "pending").length;
    const rejected = systemDonations.filter(d => d.status === "rejected").length;

    // Per month
    const perMonth = {};
    verified.forEach(d => {
      const dt = new Date(d.submittedAt || d.date || d.createdAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      perMonth[key] = (perMonth[key] || 0) + Number(d.amount || 0);
    });

    // Per method
    const perMethod = {};
    verified.forEach(d => {
      const m = d.method || d.paymentMethod || "Lainnya";
      perMethod[m] = (perMethod[m] || 0) + Number(d.amount || 0);
    });

    // Top donors
    const donorMap = {};
    verified.forEach(d => {
      const uid = d.userId || "Anonim";
      donorMap[uid] = (donorMap[uid] || 0) + Number(d.amount || 0);
    });
    const topDonors = Object.entries(donorMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

    return { total, totalVerified, pending, rejected, perMonth, perMethod, topDonors };
  }, [systemDonations]);

  const formatRupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const handleExport = (type, data, filename) => {
    if (type === "print") {
      const w = window.open("", "_blank");
      w.document.write(`<html><head><title>${filename}</title><style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;margin-top:10px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px;}th{background:#f5f5f5;font-weight:bold;}</style></head><body><h2>${filename}</h2><p>Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>${data}</body></html>`);
      w.document.close(); w.print();
    } else {
      const blob = new Blob(["\ufeff" + data], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
  };

  const reportTabs = [
    { key: "jamaah", label: "Jamaah", icon: "fas fa-users" },
    { key: "kegiatan", label: "Kegiatan", icon: "fas fa-calendar-alt" },
    { key: "donasi", label: "Donasi", icon: "fas fa-hand-holding-heart" },
  ];

  return (
    <div>
      <div className="d-flex gap-2 mb-4">
        {reportTabs.map(t => (
          <button key={t.key} className={`btn btn-sm ${activeReport === t.key ? "btn-cms-save" : "btn-outline-secondary"}`}
            onClick={() => setActiveReport(t.key)}>
            <i className={`${t.icon} me-1`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* === JAMAAT REPORT === */}
      {activeReport === "jamaah" && (
        <div className="row g-3">
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#48cae4" }}>{jamaahStats.total}</div>
              <small className="text-secondary">Total Jamaah</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80" }}>{jamaahStats.active}</div>
              <small className="text-secondary">Aktif</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#f87171" }}>{jamaahStats.inactive + jamaahStats.suspended}</div>
              <small className="text-secondary">Nonaktif / Suspended</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#fbbf24" }}>{jamaahStats.thisMonth}</div>
              <small className="text-secondary">Baru Bulan Ini</small>
            </div>
          </div>
          <div className="col-md-6">
            <div className="cms-card" style={{ padding: "20px" }}>
              <h6 className="text-white mb-3">Komposisi Role</h6>
              {Object.entries(jamaahStats.byRole).map(([role, count]) => (
                <div key={role} className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary" style={{ fontSize: "13px" }}>{role}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#e8c96e" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="col-md-6">
            <div className="cms-card" style={{ padding: "20px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-white mb-0">Daftar Jamaah</h6>
                <button className="btn btn-sm btn-outline-success" onClick={() => {
                  const csv = "Nama,Email,Role,Status\n" + systemUsers.map(u => `"${u.name || "-"}","${u.email}","${u.role || "member"}","${u.status || "-"}"`).join("\n");
                  handleExport("csv", csv, "Laporan_Jamaah");
                }}><i className="fas fa-file-csv me-1"></i> Export CSV</button>
              </div>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {systemUsers.slice(0, 10).map(u => (
                  <div key={u.id} className="d-flex justify-content-between py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "12px" }}>
                    <span className="text-white">{u.name || "-"}</span>
                    <span className="text-secondary">{u.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === KEGIATAN REPORT === */}
      {activeReport === "kegiatan" && (
        <div className="row g-3">
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#64ffda" }}>{kegiatanStats.total}</div>
              <small className="text-secondary">Total Kegiatan</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80" }}>{kegiatanStats.approved}</div>
              <small className="text-secondary">Peserta Disetujui</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#f87171" }}>{kegiatanStats.rejected}</div>
              <small className="text-secondary">Peserta Ditolak</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#fbbf24" }}>{kegiatanStats.pending}</div>
              <small className="text-secondary">Menunggu Review</small>
            </div>
          </div>
          <div className="col-12">
            <div className="cms-card" style={{ padding: "20px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-white mb-0">Ringkasan Partisipasi</h6>
                <button className="btn btn-sm btn-outline-success" onClick={() => {
                  const csv = "Event,Status Peserta,Jumlah\nDisetujui,Approved," + kegiatanStats.approved + "\nDitolak,Rejected," + kegiatanStats.rejected + "\nPending,Pending," + kegiatanStats.pending;
                  handleExport("csv", csv, "Laporan_Kegiatan");
                }}><i className="fas fa-file-csv me-1"></i> Export CSV</button>
              </div>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "120px", textAlign: "center", padding: "16px", background: "rgba(74,222,128,0.08)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#4ade80" }}>{kegiatanStats.approved}</div>
                  <small className="text-secondary">Approved</small>
                </div>
                <div style={{ flex: 1, minWidth: "120px", textAlign: "center", padding: "16px", background: "rgba(248,113,113,0.08)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#f87171" }}>{kegiatanStats.rejected}</div>
                  <small className="text-secondary">Rejected</small>
                </div>
                <div style={{ flex: 1, minWidth: "120px", textAlign: "center", padding: "16px", background: "rgba(251,191,36,0.08)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#fbbf24" }}>{kegiatanStats.pending}</div>
                  <small className="text-secondary">Pending</small>
                </div>
                <div style={{ flex: 1, minWidth: "120px", textAlign: "center", padding: "16px", background: "rgba(100,255,218,0.08)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#64ffda" }}>{kegiatanStats.attended}</div>
                  <small className="text-secondary">Hadir</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === DONASI REPORT === */}
      {activeReport === "donasi" && (
        <div className="row g-3">
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#e8c96e" }}>{formatRupiah(donasiStats.totalVerified)}</div>
              <small className="text-secondary">Total Donasi Verified</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#fbbf24" }}>{donasiStats.pending}</div>
              <small className="text-secondary">Pending</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#f87171" }}>{donasiStats.rejected}</div>
              <small className="text-secondary">Ditolak</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="cms-card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#48cae4" }}>{donasiStats.total}</div>
              <small className="text-secondary">Total Transaksi</small>
            </div>
          </div>

          <div className="col-md-6">
            <div className="cms-card" style={{ padding: "20px" }}>
              <h6 className="text-white mb-3">Donasi Per Metode</h6>
              {Object.entries(donasiStats.perMethod).map(([method, amount]) => (
                <div key={method} className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary" style={{ fontSize: "13px" }}>{method}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#e8c96e" }}>{formatRupiah(amount)}</span>
                </div>
              ))}
              {Object.keys(donasiStats.perMethod).length === 0 && <p className="text-secondary">Belum ada data.</p>}
            </div>
          </div>

          <div className="col-md-6">
            <div className="cms-card" style={{ padding: "20px" }}>
              <h6 className="text-white mb-3">Top Donatur</h6>
              {donasiStats.topDonors.map(([userId, amount], i) => (
                <div key={userId} className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ fontSize: "13px" }}>
                    <span style={{ color: "#d9a830", fontWeight: 700, marginRight: "8px" }}>#{i + 1}</span>
                    <span className="text-white">{userId}</span>
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#e8c96e" }}>{formatRupiah(amount)}</span>
                </div>
              ))}
              {donasiStats.topDonors.length === 0 && <p className="text-secondary">Belum ada data.</p>}
            </div>
          </div>

          <div className="col-12">
            <div className="cms-card" style={{ padding: "20px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-white mb-0">Donasi Per Bulan</h6>
                <button className="btn btn-sm btn-outline-success" onClick={() => {
                  const csv = "Bulan,Total\n" + Object.entries(donasiStats.perMonth).map(([m, a]) => `${m},${a}`).join("\n");
                  handleExport("csv", csv, "Laporan_Donasi_Bulanan");
                }}><i className="fas fa-file-csv me-1"></i> Export CSV</button>
              </div>
              {Object.entries(donasiStats.perMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, amount]) => (
                <div key={month} className="d-flex justify-content-between align-items-center mb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                  <span className="text-secondary" style={{ fontSize: "13px" }}>{month}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: `${Math.min((amount / donasiStats.totalVerified) * 200, 200)}px`, height: "6px", background: "var(--gold-primary)", borderRadius: "3px" }}></div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#e8c96e" }}>{formatRupiah(amount)}</span>
                  </div>
                </div>
              ))}
              {Object.keys(donasiStats.perMonth).length === 0 && <p className="text-secondary">Belum ada data.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
