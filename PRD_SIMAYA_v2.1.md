# 📑 PRD: Sistem Manajemen Yayasan (SIMAYA)
## Yayasan Pesantren Ahlus-Shafa Wal-Wafa
**Versi**: 2.1 | **Update**: 15 September 2026 | **Status**: Migration v2 (React + Firebase)

---

## 1. RINGKASAN EKSEKUTIF

SIMAYA (Sistem Manajemen Yayasan) adalah platform digital terpadu untuk Yayasan Pesantren Ahlus-Shafa Wal-Wafa yang terdiri dari 3 modul utama:

| Modul | URL | Deskripsi |
|-------|-----|-----------|
| **Landing Page CMS** | `/admin/cms` | Manajemen konten website publik |
| **SIMAYA Dashboard** | `/admin/simaya` | Sistem manajemen yayasan internal |
| **Member Portal** | `/jamaah/*` | Portal jamaah (registrasi, donasi, kegiatan) |

---

## 2. ARSITEKTUR TEKNIS

### 2.1 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v3 + Custom CSS |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Google Drive + wsrv.nl CDN |
| Hosting | GitHub Pages |
| Build | Vite (code splitting) |

### 2.2 Struktur File
```
src/
├── admin/
│   ├── LandingPageCMS.jsx    # CMS Landing Page (11 tab)
│   ├── SimayaDashboard.jsx   # SIMAYA Admin (7 tab)
│   ├── RoleManager.jsx       # Role & Permission Manager
│   ├── ReportsModule.jsx     # Laporan & Export
│   ├── NotificationBell.jsx  # In-app Notifications
│   ├── MediaManager.jsx      # Media Library (Google Drive)
│   ├── DataTable.jsx         # Reusable Table Component
│   ├── Login.jsx             # Admin Login
│   └── MosqueScene.jsx       # 3D Login Scene
├── jamaah/
│   ├── Login.jsx             # Member Login
│   ├── Register.jsx          # Member Registration
│   ├── Dashboard.jsx         # Member Dashboard
│   ├── Profile.jsx           # Member Profile
│   ├── Events.jsx            # Event Listing
│   ├── MyEvents.jsx          # Registration History
│   ├── Donations.jsx         # Donation Form
│   └── DonationHistory.jsx   # Donation History
├── pages/
│   ├── Home.jsx              # Landing Page Utama
│   ├── Profil.jsx            # Profil & Sejarah
│   ├── Kegiatan.jsx          # Kegiatan Publik
│   ├── Artikel.jsx           # Artikel & Kajian
│   └── Galeri.jsx            # Galeri Foto & Video
├── utils/
│   ├── firebase.js           # Firebase Config + Helpers
│   ├── roleHelper.js         # RBAC Definitions
│   ├── businessRules.js      # Business Logic Engine
│   ├── notificationHelper.js # Notification System
│   ├── auditLogger.js        # Audit Trail Logger
│   ├── imageHelper.js        # URL Formatting (Google Drive)
│   └── webpHelper.js         # Image Compression
└── components/
    └── Layout.jsx            # Shared Layout (Navbar + Footer)
```

---

## 3. MODUL: LANDING PAGE CMS

### 3.1 Tab CMS (11 Section)
| Tab | Firestore Collection | Status |
|-----|---------------------|--------|
| Hero (Stats) | `heroStats` | ✅ Selesai |
| Tentang Kami | `tentangFeatures` | ✅ Selesai |
| Profil & Sejarah | `sejarahs` | ✅ Selesai |
| Struktur Organisasi | `strukturs` | ✅ Selesai |
| Visi & Misi | `misis` | ✅ Selesai |
| Kegiatan | `kegiatans` | ✅ Selesai |
| Artikel | `artikels` | ✅ Selesai |
| Galeri Foto | `galeriEvents` | ✅ Selesai |
| Galeri Video | `videos` | ✅ Selesai |
| Nilai Yayasan | `nilais` | ✅ Selesai |
| Lokasi & Sosial | `sosials` | ✅ Selesai |

### 3.2 Fitur CMS
- ✅ CRUD per section dengan form spesifik per tab
- ✅ Upload gambar via Google Drive + WebP conversion
- ✅ Modal editing dengan preview
- ✅ General settings per section (badge, title, subtitle)

---

## 4. MODUL: SIMAYA DASHBOARD

### 4.1 Tab SIMAYA (7 Section)
| Tab | Fitur | Status |
|-----|-------|--------|
| Dashboard | Statistik ringkas (jamaah, kegiatan, donasi pending) | ✅ Selesai |
| Jamaah | CRUD users, toggle status, search/filter | ✅ Selesai |
| Kegiatan SIMAYA | CRUD kegiatan internal, modal form | ✅ Selesai |
| Registrasi | Approve/Reject pendaftaran, search/filter | ✅ Selesai |
| Donasi | Verify/Reject donasi, search/filter | ✅ Selesai |
| Role Manager | RBAC visual, custom permissions per user | ✅ Selesai |
| Laporan | Jamaah/Kegiatan/Donasi reports + CSV export | ✅ Selesai |

### 4.2 DataTable Component
| Fitur | Status |
|-------|--------|
| Search/Pencarian | ✅ Selesai |
| Filter Status | ✅ Selesai |
| Sorting Kolom | ✅ Selesai |
| Pagination (10/halaman) | ✅ Selesai |
| Export CSV | ✅ Selesai |
| Print | ✅ Selesai |

---

## 5. MODUL: MEMBER PORTAL

### 5.1 Halaman Member (8 Page)
| Halaman | URL | Status |
|---------|-----|--------|
| Login | `/jamaah/login` | ✅ Selesai |
| Register | `/jamaah/register` | ✅ Selesai |
| Dashboard | `/jamaah/dashboard` | ✅ Selesai |
| Profil | `/jamaah/profile` | ✅ Selesai |
| Kegiatan Tersedia | `/jamaah/events` | ✅ Selesai |
| Kegiatan Saya | `/jamaah/my-events` | ✅ Selesai |
| Donasi | `/jamaah/donations` | ✅ Selesai |
| Riwayat Donasi | `/jamaah/donation-history` | ✅ Selesai |

---

## 6. ROLE & PERMISSION SYSTEM

### 6.1 Role Hierarchy
| Role | Level | Akses |
|------|-------|-------|
| SuperAdmin | 100 | Full access semua modul |
| Admin | 80 | SIMAYA Dashboard (kecuali Role Manager) |
| Staff | 60 | Kegiatan + Registrasi (approve/reject) |
| Member | 10 | Portal sendiri (profil, daftar, donasi) |

### 6.2 Granular Permissions
| Permission | SuperAdmin | Admin | Staff | Member |
|------------|:----------:|:-----:|:-----:|:------:|
| `activity.view` | ✅ | ✅ | ✅ | ❌ |
| `activity.create` | ✅ | ✅ | ✅ | ❌ |
| `activity.update` | ✅ | ✅ | ✅ | ❌ |
| `activity.delete` | ✅ | ✅ | ❌ | ❌ |
| `registration.view` | ✅ | ✅ | ✅ | Own |
| `registration.approve` | ✅ | ✅ | ✅ | ❌ |
| `registration.reject` | ✅ | ✅ | ✅ | ❌ |
| `donation.view` | ✅ | ✅ | ✅ | Own |
| `donation.verify` | ✅ | ✅ | ❌ | ❌ |
| `donation.reject` | ✅ | ✅ | ❌ | ❌ |
| `role.manage` | ✅ | ❌ | ❌ | ❌ |
| `audit.view` | ✅ | ❌ | ❌ | ❌ |

---

## 7. BUSINESS RULES

### 7.1 Aturan Registrasi
| # | Rule | Status |
|---|------|--------|
| R001 | Member harus berstatus `active` untuk mendaftar | ✅ |
| R002 | Kuota kegiatan: otomatis tutup jika penuh | ✅ |
| R003 | Status registrasi: Pending → Approved/Rejected | ✅ |

### 7.2 Aturan Donasi
| # | Rule | Status |
|---|------|--------|
| R004 | Hanya donasi `verified` dihitung total | ✅ |
| R005 | Nominal: minimal Rp 10.000, maks Rp 100.000.000 | ✅ |
| R006 | Staff tidak bisa ubah donasi yang sudah `verified` | ✅ |

### 7.3 Aturan Profil
| # | Rule | Status |
|---|------|--------|
| R007 | Member hanya bisa edit profil sendiri | ✅ |
| R008 | Admin bisa edit semua profil | ✅ |

### 7.4 Aturan Upload
| # | Rule | Status |
|---|------|--------|
| R009 | Format: JPG, PNG, WebP, PDF | ✅ |
| R010 | Maks size: 10MB | ✅ |
| R011 | Auto-conversion JPG/PNG → WebP | ✅ |

---

## 8. WORKFLOW

### 8.1 Registrasi Kegiatan
```
Member → Pilih kegiatan → Isi form → Submit
→ Status: Pending
→ Staff/Admin review
→ Approve / Reject
→ Notifikasi ke Member (in-app)
```

### 8.2 Donasi
```
Member → Isi nominal → Pilih metode → Upload bukti → Submit
→ Status: Pending
→ Bendahara/Admin verifikasi
→ Verified / Rejected
→ Notifikasi ke Member (in-app)
```

### 8.3 Status Data

| Entity | Status Values |
|--------|--------------|
| Member | Pending Verification, Active, Inactive, Suspended |
| Kegiatan | Draft, Published, Registration Open/Closed, Ongoing, Completed, Cancelled |
| Registrasi | Pending, Approved, Rejected, Cancelled, Attended, Absent |
| Donasi | Pending, Verified, Rejected, Cancelled |

---

## 9. NOTIFICATION SYSTEM

### 9.1 In-App Notification
| Trigger | Title | Message |
|---------|-------|---------|
| Registrasi disetujui | Status Pendaftaran | "Pendaftaran Anda untuk [event] telah disetujui" |
| Registrasi ditolak | Status Pendaftaran | "Pendaftaran Anda untuk [event] ditolak" |
| Donasi diverifikasi | Status Donasi | "Donasi [amount] telah diverifikasi" |
| Donasi ditolak | Status Donasi | "Donasi [amount] ditolak" |
| Status akun berubah | Status Akun | "Status akun Anda telah diubah menjadi: [status]" |

### 9.2 Email Notification
| Event | Status |
|-------|--------|
| Verifikasi akun | ✅ Firebase Auth bawaan |
| Reset password | ✅ Firebase Auth bawaan |
| Registrasi berhasil | ❌ Belum |
| Status berubah | ❌ Belum (perlu Cloud Functions) |

---

## 10. MEDIA MANAGEMENT

### 10.1 Media Library
| Fitur | Status |
|-------|--------|
| Upload via Google Drive link | ✅ |
| Upload lokal (WebP convert) | ✅ |
| Search by name | ✅ |
| Filter by folder | ✅ |
| Preview gambar | ✅ |
| Delete | ✅ |
| Folder: General/Artikel/Kegiatan/Galeri/Profile/Dokumen | ✅ |

### 10.2 Image Processing
| Fitur | Status |
|-------|--------|
| Auto-convert JPG/PNG → WebP | ✅ |
| Compression (max 5MB) | ✅ |
| Google Drive URL proxy via wsrv.nl | ✅ |
| Support various GDrive link formats | ✅ |

---

## 11. AUDIT LOG

### 11.1 Logged Actions
| Action | Module | Data |
|--------|--------|------|
| `create` | events, donations, registrations | old=NULL, new=data |
| `update` | events, donations, users, registrations | old=sebelum, new=setelah |
| `delete` | events, donations, users | old=data, new=NULL |

### 11.2 Log Entry Schema
```json
{
  "userId": "admin_uid",
  "action": "update",
  "module": "donations",
  "recordId": "donation_id",
  "oldValue": { "status": "pending" },
  "newValue": { "status": "verified" },
  "timestamp": "2026-09-15T10:30:00.000Z"
}
```

### 11.3 Access Control
- ✅ SuperAdmin: bisa baca semua log
- ✅ Admin/Staff: tidak bisa baca log
- ✅ Semua user: bisa buat log

---

## 12. LAPORAN & EXPORT

### 12.1 Laporan Jamaah
| Metrik | Status |
|--------|--------|
| Total jamaah | ✅ |
| Aktif / Nonaktif / Suspended | ✅ |
| Baru bulan ini | ✅ |
| Komposisi role | ✅ |
| Export CSV | ✅ |

### 12.2 Laporan Kegiatan
| Metrik | Status |
|--------|--------|
| Total kegiatan | ✅ |
| Peserta Approved/Rejected/Pending | ✅ |
| Peserta Hadir/Absent | ✅ |
| Export CSV | ✅ |

### 12.3 Laporan Donasi
| Metrik | Status |
|--------|--------|
| Total verified | ✅ |
| Per bulan (bar chart) | ✅ |
| Per metode pembayaran | ✅ |
| Top donatur | ✅ |
| Export CSV | ✅ |
| Export Excel (.xlsx) | ❌ Belum |
| Export PDF | ❌ Belum |

---

## 13. SECURITY

### 13.1 Firebase Auth
| Fitur | Status |
|-------|--------|
| Email + Password | ✅ |
| Email Verification | ✅ (opsional) |
| Forgot Password | ✅ |
| Session Security | ✅ (Firebase default) |

### 13.2 Firestore Security Rules
| Rule | Status |
|------|--------|
| Public read: CMS collections | ✅ |
| Admin write: CMS collections | ✅ |
| User CRUD (role-based) | ✅ |
| Audit logs: SuperAdmin only read | ✅ |
| Donations: Admin verify only | ✅ |
| File size limit: 10MB | ✅ |
| File type validation | ✅ |
| Rate limiting | ❌ Belum |

### 13.3 Backup & Retention
| Item | Retention | Status |
|------|-----------|--------|
| Data transaksi (registrasi/donasi) | Permanent | ✅ |
| Data member | Permanent | ✅ |
| Audit log | 2 tahun | ❌ Belum ada auto-purge |
| Media/Gambar | Permanent | ✅ |
| Database backup | Manual | ❌ Belum ada Cloud Function |

---

## 14. NON-FUNCTIONAL REQUIREMENTS

### 14.1 Performance
| Target | Status |
|--------|--------|
| Dashboard load < 3 detik | ✅ |
| Pagination untuk data besar | ✅ |
| Lazy loading gambar | ✅ |
| Image compression WebP | ✅ |
| Code splitting via Vite | ✅ |

### 14.2 Responsive Design
| Device | Status |
|--------|--------|
| Desktop (1200px+) | ✅ |
| Tablet (768px-1199px) | ✅ |
| Mobile (< 768px) | ✅ |

### 14.3 Browser Support
| Browser | Status |
|---------|--------|
| Chrome | ✅ |
| Edge | ✅ |
| Firefox | ✅ |
| Safari | ✅ |

### 14.4 Accessibility
| Item | Status |
|------|--------|
| Keyboard navigation | ✅ |
| Readable contrast (dark theme) | ✅ |
| Form labels | ✅ |
| Error messages | ✅ |

---

## 15. RINGKASAN STATUS

### ✅ SUDAH TERLAKSANO (19 Fitur)
1. Landing Page CMS (11 section)
2. Admin Login dengan 3D Mosque Scene
3. SIMAYA Dashboard (7 tab)
4. DataTable reusable (search/filter/sort/pagination/export)
5. Role Manager (4 role + granular permissions)
6. Media Library (Google Drive + WebP)
7. Member Portal (8 halaman)
8. Registration System
9. Donation System
10. Notification System (in-app)
11. Audit Logging
12. Business Rules Engine
13. Laporan & Reports (3 kategori)
14. Export CSV & Print
15. Firebase Security Rules
16. Responsive Design
17. Image Compression WebP
18. Google Drive URL Proxy (wsrv.nl)
19. Dark Theme Admin UI

### ❌ BELUM TERLAKSANA (8 Fitur)
1. **Email Notification via Cloud Functions** — Otomatis kirim email saat status berubah
2. **Export Excel (.xlsx)** — Untuk download laporan
3. **Export PDF** — Untuk cetak laporan
4. **Rate Limiting** — Proteksi brute force
5. **Auto-purge Audit Log** — Hapus log > 2 tahun
6. **Database Backup Automation** — Cloud Function backup berkala
7. **Column Visibility Toggle** — Sembunyikan/tampilkan kolom di tabel
8. **Notification UI di Member Portal** — Halaman notifikasi untuk jamaah

---

## 16. DATA STRUCTURE

### 6.1 Core Entities
```
├── users/
│   ├── {uid}
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── role: "superadmin" | "admin" | "staff" | "member"
│   │   ├── status: "active" | "inactive" | "suspended"
│   │   ├── permissions: string[]
│   │   └── createdAt: timestamp
│
├── events/
│   ├── {eventId}
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── jadwal: string
│   │   ├── startDate: string
│   │   ├── quota: number (0 = unlimited)
│   │   ├── is_active: boolean
│   │   └── createdAt: timestamp
│
├── eventRegistrations/
│   ├── {regId}
│   │   ├── userId: string
│   │   ├── eventId: string
│   │   ├── status: "pending" | "approved" | "rejected" | "attended" | "absent"
│   │   ├── registeredAt: timestamp
│   │   ├── approvedBy: string (uid admin)
│   │   └── approvedAt: timestamp
│
├── donations/
│   ├── {donId}
│   │   ├── userId: string
│   │   ├── amount: number
│   │   ├── method: string (nama metode bayar)
│   │   ├── costCenter: string
│   │   ├── proofImageUrl: string (link bukti transfer)
│   │   ├── status: "pending" | "verified" | "rejected"
│   │   ├── submittedAt: timestamp
│   │   ├── verifiedBy: string (uid admin)
│   │   └── verifiedAt: timestamp
│
├── media/
│   ├── {mediaId}
│   │   ├── name: string
│   │   ├── driveLink: string (Google Drive URL)
│   │   ├── fileId: string (GDrive file ID)
│   │   ├── url: string (wsrv.nl proxy URL)
│   │   ├── folder: string (general/artikel/kegiatan/galeri/profile/dokumen)
│   │   ├── type: string (MIME type)
│   │   ├── size: number (bytes)
│   │   └── createdAt: timestamp
│
├── notifications/
│   ├── {notifId}
│   │   ├── userId: string (target user or "admin" or "all")
│   │   ├── title: string
│   │   ├── message: string
│   │   ├── type: "registration" | "donation" | "general"
│   │   ├── link: string (redirect URL)
│   │   ├── read: boolean
│   │   └── createdAt: timestamp
│
├── auditLogs/
│   ├── {logId}
│   │   ├── userId: string (who performed action)
│   │   ├── action: "create" | "update" | "delete"
│   │   ├── module: string (collection name)
│   │   ├── recordId: string (affected document ID)
│   │   ├── oldValue: object (state before change)
│   │   ├── newValue: object (state after change)
│   │   └── timestamp: timestamp
│
├── settings/
│   └── site_config (document)
│       ├── hero_title: string
│       ├── hero_subtitle: string
│       ├── hero_arabic: string
│       ├── biografi_*: string
│       ├── tentang_*: string
│       ├── visi_teks: string
│       ├── lokasi_*: string
│       └── ... (CMS settings)
│
├── heroStats/        # Landing CMS
├── nilais/           # Landing CMS
├── misis/            # Landing CMS
├── tentangFeatures/  # Landing CMS
├── sejarahs/         # Landing CMS
├── strukturs/        # Landing CMS
├── kegiatans/        # Landing CMS (showcase)
├── artikels/         # Landing CMS
├── galeriEvents/     # Landing CMS (with nested photos array)
├── videos/           # Landing CMS
└── sosials/          # Landing CMS
```

---

**Dokumen ini siap untuk review dan presentasi.**
