# Dokumen Spesifikasi Arsitektur
**Kelompok 5 — Sistem Pemesanan Makanan (Food Delivery)**
Anggota: Ari, Ahmad Baihaqi, Akhyan, Rifki

## 1. Tujuan & Tantangan
- Melayani banyak pengguna secara bersamaan (skalabilitas multi-user).
- Menjaga konsistensi status pesanan: *Sedang Disiapkan → Diantar → Selesai*.
- Data pesanan harus bisa dipulihkan penuh setelah sistem mati (lihat `DRP.md`).

## 2. Arsitektur

```
 Browser (user/restoran/driver)
        │  :8080
        ▼
 ┌─────────────────────┐
 │ frontend (nginx)    │  React + Vite + Tailwind (hasil build statis)
 │  /      → file statis│
 │  /api/* → proxy ────┼──┐
 └─────────────────────┘  │
                          ▼
                 ┌─────────────────┐
                 │ api (Node/Express)│  :3000
                 └────────┬────────┘
                          ▼
                 ┌─────────────────┐
                 │ db (PostgreSQL 16)│  :5432 (internal)
                 └────────┬────────┘
                          ▼
                 Volume Docker: pgdata  (+ bind mount ./backups)
```

## 3. Komponen
| Service | Teknologi | Peran |
|---|---|---|
| frontend | React 19, Vite, Tailwind, nginx | UI pesanan; reverse proxy `/api` ke backend |
| api | Node 22, Express, pg | REST API pesanan |
| db | PostgreSQL 16 | Penyimpanan pesanan (tabel `orders`) |

## 4. Endpoint API
| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/health` | Cek API & koneksi DB |
| GET | `/api/orders` | Daftar pesanan |
| POST | `/api/orders` | Buat pesanan `{customerName, items[]}` |
| PATCH | `/api/orders/:id` | Ubah status pesanan |

## 5. Skema Data (`orders`)
`id (UUID PK)`, `customer_name`, `items (JSONB)`, `status (CHECK 3 nilai)`, `created_at`, `updated_at`.
Constraint `CHECK` pada status menjaga konsistensi status pesanan di level database.

## 6. Keputusan Desain
- **Satu DB sebagai sumber kebenaran status** → state tidak disimpan di memori aplikasi, sehingga app aman di-restart/direbuild.
- **Named volume `pgdata`** → data bertahan walau container dihapus.
- **nginx reverse proxy** → frontend memakai path relatif `/api`, tanpa masalah CORS.
- **Healthcheck + `depends_on`** → API baru start setelah DB siap.
