-- Create role_permission table for access control
CREATE TABLE IF NOT EXISTS role_permission (
  id BIGSERIAL PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('Owner', 'Admin', 'Mitra Cabang', 'Cabang', 'Link')),
  feature TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, feature)
);

-- Create indexes for better performance
CREATE INDEX idx_role_permission_role ON role_permission(role);
CREATE INDEX idx_role_permission_feature ON role_permission(feature);

-- Insert default permissions for Owner (full access to everything)
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'stok', true, true, true),
('Owner', 'penjualan', true, true, true),
('Owner', 'laporan', true, true, true),
('Owner', 'pengaturan-harga', true, true, true),
('Owner', 'penyetoran', true, true, true),
('Owner', 'kupon', true, true, true),
('Owner', 'hak-akses', true, true, true),
('Owner', 'user', true, true, true);

-- Insert default permissions for Admin (most access except role management)
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Admin', 'stok', true, true, true),
('Admin', 'penjualan', true, true, true),
('Admin', 'laporan', true, true, false),
('Admin', 'pengaturan-harga', true, true, false),
('Admin', 'penyetoran', true, true, false),
('Admin', 'kupon', true, true, false),
('Admin', 'hak-akses', false, false, false),
('Admin', 'user', true, true, false);

-- Insert default permissions for Mitra Cabang (limited access)
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Mitra Cabang', 'stok', true, false, false),
('Mitra Cabang', 'penjualan', true, false, false),
('Mitra Cabang', 'laporan', true, false, false),
('Mitra Cabang', 'pengaturan-harga', false, false, false),
('Mitra Cabang', 'penyetoran', false, false, false),
('Mitra Cabang', 'kupon', true, false, false),
('Mitra Cabang', 'hak-akses', false, false, false),
('Mitra Cabang', 'user', false, false, false);

-- Insert default permissions for Cabang (very limited access)
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Cabang', 'stok', true, false, false),
('Cabang', 'penjualan', true, false, false),
('Cabang', 'laporan', true, false, false),
('Cabang', 'pengaturan-harga', false, false, false),
('Cabang', 'penyetoran', false, false, false),
('Cabang', 'kupon', true, false, false),
('Cabang', 'hak-akses', false, false, false),
('Cabang', 'user', false, false, false);

-- Insert default permissions for Link (minimal access)
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Link', 'stok', true, false, false),
('Link', 'penjualan', false, false, false),
('Link', 'laporan', false, false, false),
('Link', 'pengaturan-harga', false, false, false),
('Link', 'penyetoran', false, false, false),
('Link', 'kupon', true, false, false),
('Link', 'hak-akses', false, false, false),
('Link', 'user', false, false, false);
