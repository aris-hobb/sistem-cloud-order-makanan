# Sistem Pemesanan Makanan — Kelompok 5 (Cloud Computing)

Stack: React + Vite + Tailwind • Node/Express • PostgreSQL • Docker Compose

## Menjalankan dengan Docker
```bash
cp .env.example .env        # lalu ubah DB_PASSWORD
docker compose up -d --build
```
- UI: http://localhost:8080
- API health: http://localhost:3000/api/health

Hentikan: `docker compose down` (data tetap aman di volume `pgdata`).
Reset total (hapus data): `docker compose down -v`.

## Dokumen
- [Arsitektur](docs/ARSITEKTUR.md)
- [Disaster Recovery Plan](docs/DRP.md)
- Prompt AI yang dipakai: lihat `docs/PROMPT_AI.md`
