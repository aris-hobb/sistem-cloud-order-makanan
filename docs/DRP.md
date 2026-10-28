# Disaster Recovery Plan (DRP) — Versi Awal
**Kelompok 5 — Food Delivery**

## 1. Aset Kritis
Tabel `orders` di PostgreSQL (volume `pgdata`). Aplikasi (frontend/API) bersifat *stateless* dan dapat dibangun ulang dari Git.

## 2. Target Pemulihan
| Metrik | Target | Alasan |
|---|---|---|
| **RTO** | ≤ 15 menit | Restoran & driver tidak boleh lama kehilangan visibilitas pesanan aktif |
| **RPO** | ≤ 1 jam | Backup berkala tiap 1 jam; pesanan dalam 1 jam terakhir dapat diinput ulang dari catatan restoran |

> Angka ini adalah usulan awal; sesuaikan dan buktikan pada Pertemuan 4.

## 3. Strategi Backup
- Metode: `pg_dump` logis ke file `.sql`, dari dalam container `db`.
- Frekuensi: tiap 1 jam (cron/bash script — dibuat di Pertemuan 4).
- Lokasi: bind mount `./backups` di host (di luar volume DB, agar selamat jika volume hilang).
- Retensi: 24 backup terakhir (±1 hari).
- Fondasi Pertemuan 2: named volume `pgdata` melindungi data dari penghapusan container biasa.

## 4. Skenario Bencana
| Skenario | Dampak | Respons |
|---|---|---|
| Container mati | Layanan down, data aman di volume | `docker compose up -d` |
| Seluruh environment (App + DB + volume) terhapus | Data hilang | Restore dari backup terbaru (prosedur §5) |
| Data korup / salah hapus | Data salah | Restore dari backup sebelum kejadian |

## 5. Prosedur Pemulihan (Restore)
1. Pastikan file backup terbaru ada di `./backups`.
2. `docker compose up -d db` lalu tunggu status *healthy*.
3. Muat ulang data: `docker compose exec -T db psql -U $DB_USER -d $DB_NAME < backups/<file>.sql`
4. `docker compose up -d --build` untuk menjalankan API & frontend.
5. Validasi: buka UI, pastikan pesanan berstatus **"Sedang Disiapkan"** muncul sesuai kondisi sebelum bencana; cek `/api/health`.
6. Catat waktu mulai & selesai → bandingkan dengan RTO.

## 6. DR Test (dijalankan di Pertemuan 4)
Hapus seluruh environment (`docker compose down -v`) saat ada pesanan berstatus "Sedang Disiapkan", restore dari backup, lalu pastikan status pesanan tidak ter-reset atau hilang.
