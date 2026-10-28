-- Dijalankan otomatis oleh Postgres HANYA saat volume masih kosong (pertama kali)
CREATE TABLE IF NOT EXISTS orders (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,
    items         JSONB        NOT NULL DEFAULT '[]',
    status        VARCHAR(30)  NOT NULL DEFAULT 'Sedang Disiapkan'
                  CHECK (status IN ('Sedang Disiapkan', 'Diantar', 'Selesai')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Data dummy untuk DR Test (pesanan berstatus "Sedang Disiapkan")
INSERT INTO orders (customer_name, items, status) VALUES
 ('Budi Santoso', '[{"name":"Nasi Goreng","price":20000,"qty":2},{"name":"Es Teh","price":5000,"qty":2}]', 'Sedang Disiapkan'),
 ('Siti Aminah',  '[{"name":"Ayam Geprek","price":18000,"qty":1}]', 'Sedang Disiapkan'),
 ('Andi Wijaya',  '[{"name":"Mie Ayam","price":15000,"qty":3}]', 'Diantar'),
 ('Dewi Lestari', '[{"name":"Soto Ayam","price":17000,"qty":1}]', 'Selesai');
