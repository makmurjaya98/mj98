CREATE TABLE IF NOT EXISTS deposit (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  link_id BIGINT REFERENCES users(id),
  cabang_id BIGINT REFERENCES users(id),
  mitra_id BIGINT REFERENCES users(id),
  jumlah DECIMAL(15,2) NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('Link', 'Cabang', 'Mitra Cabang')),
  keterangan TEXT
);

CREATE INDEX idx_deposit_created_at ON deposit(created_at);
CREATE INDEX idx_deposit_kategori ON deposit(kategori);
CREATE INDEX idx_deposit_link_id ON deposit(link_id);
CREATE INDEX idx_deposit_cabang_id ON deposit(cabang_id);
CREATE INDEX idx_deposit_mitra_id ON deposit(mitra_id);
