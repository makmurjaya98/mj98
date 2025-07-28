-- Add role and jumlah_penjualan to klaim_kupon table to snapshot performance at claim time
ALTER TABLE klaim_kupon ADD COLUMN role TEXT;
ALTER TABLE klaim_kupon ADD COLUMN jumlah_penjualan INTEGER;

-- Add a check constraint for the new role column
ALTER TABLE klaim_kupon ADD CONSTRAINT check_role CHECK (role IN ('Mitra Cabang', 'Cabang', 'Link'));
