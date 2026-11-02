# Laporan Stress Test — Kelompok 5 (Food Delivery)

**Tools:** k6 (Docker `grafana/k6`) · **Target:** `GET/POST/PATCH /api/orders` · **Skenario:** 70% baca, 30% tulis (buat pesanan + ubah status) · Ramp-up 30s, tahan 90s, ramp-down 10s.
**Spesifikasi host:** 16 CPU, ~6.5 GB RAM (Docker Desktop).

## 1. Hasil per tahap (isi dari `results/summary-*.json` / dashboard HTML)

| VU | Throughput (req/s) | Avg (ms) | p95 (ms) | Max (ms) | Error rate (%) | CPU api / db | Status |
|----|----|----|----|----|----|----|----|
| 10   |  |  |  |  |  |  |  |
| 100  |  |  |  |  |  |  |  |
| 500  |  |  |  |  |  |  |  |
| 1000 |  |  |  |  |  |  |  |

Cara ambil angka: `http_reqs` → rate (req/s), `http_req_duration` → avg/p(95)/max, `http_req_failed` → error rate. CPU dari `results/docker-stats-*.txt`.

## 2. Grafik
Lampirkan screenshot dari `results/report-*-vu.html` (Throughput, Response Time, Error Rate), satu per tahap.

## 3. Titik kegagalan
Arsitektur mulai gagal pada ___ VU (error ___ / timeout) dengan error rate ___%.

## 4. Analisis bottleneck (sesuaikan dengan data nyata Anda)
1. **Connection pool PostgreSQL.** `server.js` memakai `new Pool()` tanpa `max`, sehingga default 10 koneksi. Pada ratusan VU, request antre menunggu koneksi, p95 naik tajam.
2. **`GET /api/orders` tanpa LIMIT/pagination.** Query `SELECT * ... ORDER BY created_at DESC` makin berat karena tes terus menambah baris, sehingga payload dan waktu respons membesar.
3. **Satu instance API (single Node.js process).** Event loop berjalan di satu core sehingga CPU api mentok di ~100% walau host punya 16 core.
4. **Tidak ada index pada `created_at`.** Sorting memakai seq scan + sort.
5. **Nginx dan limit file descriptor** dapat jadi batas pada 1000 VU bila tes lewat port 8080.

## 5. Rekomendasi perbaikan
- Naikkan `max` pool (mis. 20–50) dan tambahkan `idleTimeoutMillis`.
- Tambah `LIMIT 50` / pagination dan `CREATE INDEX idx_orders_created_at ON orders(created_at DESC)`.
- Scale horizontal API: `docker compose up --scale api=3` + load balancer Nginx.
- Cache hasil `GET /api/orders` (TTL pendek) atau gunakan Redis.
