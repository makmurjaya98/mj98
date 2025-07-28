-- Create kupon_hadiah table
CREATE TABLE IF NOT EXISTS kupon_hadiah (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nama TEXT NOT NULL,
  deskripsi TEXT,
  target_role TEXT NOT NULL CHECK (target_role IN ('Mitra Cabang', 'Cabang', 'Link')),
  minimal_penjualan INTEGER NOT NULL,
  periode_mulai DATE NOT NULL,
  periode_berakhir DATE NOT NULL,
  jumlah_pemenang INTEGER NOT NULL,
  hadiah JSONB NOT NULL,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai', 'dibatalkan'))
);

-- Create klaim_kupon table for tracking claims
CREATE TABLE IF NOT EXISTS klaim_kupon (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  kupon_id BIGINT NOT NULL REFERENCES kupon_hadiah(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  posisi_pemenang INTEGER NOT NULL,
  hadiah_diterima TEXT NOT NULL,
  status TEXT DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'disetujui', 'ditolak')),
  catatan TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_kupon_hadiah_target_role ON kupon_hadiah(target_role);
CREATE INDEX idx_kupon_hadiah_periode ON kupon_hadiah(periode_mulai, periode_berakhir);
CREATE INDEX idx_kupon_hadiah_status ON kupon_hadiah(status);
CREATE INDEX idx_klaim_kupon_kupon_id ON klaim_kupon(kupon_id);
CREATE INDEX idx_klaim_kupon_user_id ON klaim_kupon(user_id);
CREATE INDEX idx_klaim_kupon_status ON klaim_kupon(status);
