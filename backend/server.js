import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const PORT = process.env.PORT || 3000;
const STATUSES = ['Sedang Disiapkan', 'Diantar', 'Selesai'];

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'fooddelivery',
});

const toOrder = (r) => ({
  id: r.id,
  customerName: r.customer_name,
  items: r.items,
  status: r.status,
  createdAt: r.created_at,
  total: r.items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0),
});

const app = express();
app.use(cors());
app.use(express.json());

// Health check (dipakai Docker & untuk validasi RTO saat DR Test)
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.get('/api/orders', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows.map(toOrder));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal mengambil data pesanan' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customerName, items } = req.body;
  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customerName dan items wajib diisi' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO orders (customer_name, items) VALUES ($1, $2) RETURNING *',
      [customerName, JSON.stringify(items)]
    );
    res.status(201).json(toOrder(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal membuat pesanan' });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status harus salah satu dari: ${STATUSES.join(', ')}` });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    res.json(toOrder(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal memperbarui status' });
  }
});

app.listen(PORT, () => console.log(`API berjalan di port ${PORT}`));
