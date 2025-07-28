CREATE TABLE voucher_stocks (
  id BIGSERIAL PRIMARY KEY,
  voucher_type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  link_id BIGINT NOT NULL REFERENCES users(id),
  cabang_id BIGINT NOT NULL REFERENCES users(id),
  mitra_cabang_id BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voucher_type, link_id)
);

CREATE TABLE voucher_prices (
  id BIGSERIAL PRIMARY KEY,
  cabang_id BIGINT NOT NULL REFERENCES users(id),
  voucher_type TEXT NOT NULL,
  harga_pokok DECIMAL(15,2) NOT NULL,
  harga_jual DECIMAL(15,2) NOT NULL,
  share_harga_cabang DECIMAL(15,2) NOT NULL,
  fee_cabang_pct DECIMAL(5,2) NOT NULL,
  fee_link_pct DECIMAL(5,2) NOT NULL,
  komisi_mitra_pct DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cabang_id, voucher_type)
);

CREATE INDEX idx_voucher_stocks_link_id ON voucher_stocks(link_id);
CREATE INDEX idx_voucher_stocks_cabang_id ON voucher_stocks(cabang_id);
CREATE INDEX idx_voucher_stocks_mitra_cabang_id ON voucher_stocks(mitra_cabang_id);
CREATE INDEX idx_voucher_stocks_voucher_type ON voucher_stocks(voucher_type);

CREATE INDEX idx_voucher_prices_cabang_id ON voucher_prices(cabang_id);
CREATE INDEX idx_voucher_prices_voucher_type ON voucher_prices(voucher_type);
