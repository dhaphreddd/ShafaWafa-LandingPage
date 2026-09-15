import React, { useState, useMemo } from "react";

export default function DataTable({ columns, data, title, count, searchable = true, searchPlaceholder = "Cari...", statuses = [], onSearch, onFilterStatus, filterStatus, searchTerm, setSearchTerm, setFilterStatus, onAdd, addLabel, renderRowActions, emptyMessage = "Tidak ada data" }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);
  const paginatedData = sortedData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExportCSV = () => {
    const header = columns.map(c => c.label).join(",");
    const rows = data.map(row => columns.map(c => `"${String(row[c.key] || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const csv = header + "\n" + rows;
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title || "export"}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background: #fafafa; }
      </style></head><body>
      <h2>${title || "Laporan"}</h2>
      <p>Tanggal cetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
      <table><thead><tr>${columns.map(c => `<th>${c.label}</th>`).join("")}</tr></thead>
      <tbody>${data.map(row => `<tr>${columns.map(c => `<td>${row[c.key] || "-"}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="cms-card">
      <div className="cms-card-header justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div className="cms-card-icon"><i className={columns[0]?.icon || "fas fa-table"}></i></div>
          <div><h5>{title}</h5><small className="text-secondary">{count !== undefined ? count : data.length} data</small></div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleExportCSV} className="btn btn-sm btn-outline-success py-2 px-3" title="Export CSV"><i className="fas fa-file-csv me-1"></i> CSV</button>
          <button onClick={handlePrint} className="btn btn-sm btn-outline-info py-2 px-3" title="Print"><i className="fas fa-print me-1"></i> Print</button>
          {onAdd && <button onClick={onAdd} className="btn btn-sm btn-cms-save py-2 px-3">{addLabel || "+ Tambah"}</button>}
        </div>
      </div>

      {(searchable || statuses.length > 0) && (
        <div className="d-flex gap-3 mb-3 flex-wrap px-3">
          <input type="text" className="form-control form-control-sm" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", maxWidth: "300px" }}
            placeholder={searchPlaceholder} value={searchTerm || ""} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          {statuses.length > 0 && (
            <select className="form-select form-select-sm" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", maxWidth: "150px" }}
              value={filterStatus || "all"} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
              <option value="all">Semua Status</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      )}

      <div className="simaya-table-wrapper">
        <table className="simaya-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable !== false ? "pointer" : "default", userSelect: "none" }}>
                  {col.label}
                  {sortConfig.key === col.key && (
                    <span className="ms-1" style={{ fontSize: "10px" }}>
                      {sortConfig.direction === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              ))}
              {renderRowActions && <th style={{ cursor: "default" }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr key={row.id || idx}>
                {columns.map(col => (
                  <td key={col.key} style={col.style || {}}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] || "-")}
                  </td>
                ))}
                {renderRowActions && <td>{renderRowActions(row)}</td>}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr><td colSpan={columns.length + (renderRowActions ? 1 : 0)} className="text-center text-secondary" style={{ padding: "24px" }}>{emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "12px", color: "#9ca3af" }}>
          <span>Halaman {currentPage} dari {totalPages} · {data.length} total</span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button key={page} className={`btn btn-sm ${page === currentPage ? "btn-cms-save" : "btn-outline-secondary"}`}
                  onClick={() => setCurrentPage(page)} style={{ minWidth: "32px" }}>{page}</button>
              );
            })}
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
