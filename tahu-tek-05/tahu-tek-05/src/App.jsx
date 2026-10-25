import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Relatif: dev -> Vite proxy, Docker -> nginx proxy ke service "api"
const API_BASE_URL = '/api';

const MENU = [
  { name: 'Nasi Goreng', price: 20000 },
  { name: 'Ayam Geprek', price: 18000 },
  { name: 'Mie Ayam', price: 15000 },
  { name: 'Soto Ayam', price: 17000 },
  { name: 'Es Teh', price: 5000 },
];

const rupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

const STATUS_STYLE = {
  'Sedang Disiapkan': 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
  Diantar: 'bg-sky-500/20 text-sky-400 border border-sky-500/40',
  Selesai: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
};

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(res.data);
      setError('');
    } catch (err) {
      console.error('Gagal terhubung ke API:', err);
      setError('Tidak dapat terhubung ke API / database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/orders/${orderId}`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui status di database!');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const items = MENU.filter((m) => cart[m.name] > 0).map((m) => ({ ...m, qty: cart[m.name] }));
    if (!customerName.trim() || items.length === 0) {
      alert('Isi nama pelanggan dan pilih minimal 1 menu.');
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/orders`, { customerName: customerName.trim(), items });
      setOrders((prev) => [res.data, ...prev]);
      setCustomerName('');
      setCart({});
    } catch (err) {
      console.error(err);
      alert('Gagal membuat pesanan!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-orange-400">Food Delivery System (Kelompok 5)</h1>
          <p className="text-slate-400 text-sm">PostgreSQL + Docker Resiliency & DR Testing</p>
        </div>
        <button
          onClick={fetchOrders}
          className="bg-slate-800 hover:bg-slate-700 text-xs px-4 py-2 rounded-lg border border-slate-700"
        >
          🔄 Refresh State DB
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-6 space-y-8">
        <section>
          <h2 className="text-lg font-bold mb-3">Buat Pesanan Baru</h2>
          <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama pelanggan"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MENU.map((m) => (
                <label key={m.name} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2 text-sm">
                  <span>{m.name} <span className="text-slate-400">({rupiah(m.price)})</span></span>
                  <input
                    type="number"
                    min="0"
                    value={cart[m.name] || 0}
                    onChange={(e) => setCart({ ...cart, [m.name]: Number(e.target.value) })}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right"
                  />
                </label>
              ))}
            </div>
            <button type="submit" className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-sm px-4 py-2 rounded-lg">
              Kirim Pesanan
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">Daftar Status Pesanan (DR Test Target)</h2>
          {error && <p className="text-red-400 mb-3">{error}</p>}
          {loading ? (
            <p className="text-slate-400">Memuat data dari PostgreSQL...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400 font-mono">{ord.id.slice(0, 8)}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS_STYLE[ord.status]}`}>
                      {ord.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg">{ord.customerName}</h3>
                  <ul className="text-sm text-slate-400 mt-1">
                    {ord.items.map((i) => (
                      <li key={i.name}>{i.qty}× {i.name}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm font-semibold">Total: {rupiah(ord.total)}</p>
                  <div className="mt-3 flex justify-end gap-2">
                    {['Sedang Disiapkan', 'Diantar', 'Selesai'].map((s) => (
                      <button
                        key={s}
                        disabled={ord.status === s}
                        onClick={() => handleStatusChange(ord.id, s)}
                        className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs px-3 py-1.5 rounded"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {orders.length === 0 && !error && <p className="text-slate-400">Belum ada pesanan.</p>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
