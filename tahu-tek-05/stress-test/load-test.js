import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Dipanggil dengan: -e VUS=100 -e HOLD=90s -e BASE_URL=http://host.docker.internal:3000
const VUS  = Number(__ENV.VUS || 10);
const HOLD = __ENV.HOLD || '90s';
const BASE = __ENV.BASE_URL || 'http://host.docker.internal:3000';

const failRate = new Rate('app_errors');

export const options = {
  stages: [
    { duration: '30s', target: VUS },  // ramp-up
    { duration: HOLD,  target: VUS },  // tahan (1-3 menit sesuai tugas)
    { duration: '10s', target: 0 },    // ramp-down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

const headers = { 'Content-Type': 'application/json' };

export default function () {
  const r = Math.random();

  if (r < 0.7) {
    // 70% baca daftar pesanan (restoran/driver polling)
    const res = http.get(`${BASE}/api/orders`);
    failRate.add(!check(res, { 'GET 200': (x) => x.status === 200 }));
  } else {
    // 30% alur tulis: buat pesanan -> ubah status ke "Diantar"
    const body = JSON.stringify({
      customerName: `LoadTest-${__VU}-${__ITER}`,
      items: [{ name: 'Nasi Goreng', price: 20000, qty: 1 }],
    });
    const c = http.post(`${BASE}/api/orders`, body, { headers });
    const okC = check(c, { 'POST 201': (x) => x.status === 201 });
    failRate.add(!okC);

    if (okC) {
      const id = c.json('id');
      const p = http.patch(`${BASE}/api/orders/${id}`,
        JSON.stringify({ status: 'Diantar' }), { headers });
      failRate.add(!check(p, { 'PATCH 200': (x) => x.status === 200 }));
    }
  }
  sleep(1);
}
