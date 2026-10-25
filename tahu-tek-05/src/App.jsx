import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Menggunakan useCallback agar fungsi tidak dibuat ulang di setiap render
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error("Gagal terhubung ke API DB:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/orders`);
        if (isMounted) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error("Gagal terhubung ke API DB:", err);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false; // Cleanup untuk mencegah memory leak
    };
  }, []);

  // Update Status Pesanan (Sedang Disiapkan -> Diantar -> Selesai)
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/orders/${orderId}`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Gagal memperbarui status di database!", err);
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
          className="bg-slate-800 hover:bg-slate-700 text-xs px-4 py-2 rounded-lg border border-slate-700">
          🔄 Refresh State DB
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-6">
        <h2 className="text-lg font-bold mb-4">Daftar Status Pesanan (DR Test Target)</h2>
        
        {loading ? (
          <p className="text-slate-400">Memuat data dari PostgreSQL...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((ord) => (
              <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 font-mono">{ord.id}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    ord.status === 'Sedang Disiapkan' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {ord.status}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{ord.customerName}</h3>
                <div className="mt-3 flex justify-end gap-2">
                  <button 
                    onClick={() => handleStatusChange(ord.id, 'Sedang Disiapkan')}
                    className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded">
                    Set Disiapkan
                  </button>
                  <button 
                    onClick={() => handleStatusChange(ord.id, 'Diantar')}
                    className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded">
                    Set Diantar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;