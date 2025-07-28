CREATE TABLE voucher_sales (
  id BIGSERIAL PRIMARY KEY,
  mitra_cabang_id BIGINT NOT NULL REFERENCES users(id),
  cabang_id BIGINT NOT NULL REFERENCES users(id),
  link_id BIGINT NOT NULL REFERENCES users(id),
  voucher_type TEXT NOT NULL,
  quantity_sold INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_voucher_sales_link_id ON voucher_sales(link_id);
CREATE INDEX idx_voucher_sales_cabang_id ON voucher_sales(cabang_id);
CREATE INDEX idx_voucher_sales_mitra_cabang_id ON voucher_sales(mitra_cabang_id);
CREATE INDEX idx_voucher_sales_voucher_type ON voucher_sales(voucher_type);
CREATE INDEX idx_voucher_sales_created_at ON voucher_sales(created_at);
