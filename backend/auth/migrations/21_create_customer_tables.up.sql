-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  alamat TEXT,
  no_hp TEXT,
  link_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_pembelian INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customers_link_id ON customers(link_id);
CREATE INDEX idx_customers_no_hp ON customers(no_hp);

-- Create customer_transactions table
CREATE TABLE IF NOT EXISTS customer_transactions (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  voucher_type TEXT NOT NULL,
  qty INTEGER NOT NULL,
  tanggal TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_transactions_customer_id ON customer_transactions(customer_id);

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id BIGSERIAL PRIMARY KEY,
  kode TEXT UNIQUE NOT NULL,
  deskripsi TEXT,
  nilai_diskon INTEGER NOT NULL,
  min_pembelian INTEGER DEFAULT 0,
  expired_at DATE,
  target TEXT NOT NULL CHECK (target IN ('mitra', 'cabang', 'link', 'pelanggan')),
  is_loyalty_coupon BOOLEAN DEFAULT false
);

CREATE INDEX idx_coupons_kode ON coupons(kode);
CREATE INDEX idx_coupons_target ON coupons(target);
CREATE INDEX idx_coupons_is_loyalty ON coupons(is_loyalty_coupon);

-- Create customer_coupons table
CREATE TABLE IF NOT EXISTS customer_coupons (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  coupon_id BIGINT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  issued_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_coupons_customer_id ON customer_coupons(customer_id);
CREATE INDEX idx_customer_coupons_coupon_id ON customer_coupons(coupon_id);
