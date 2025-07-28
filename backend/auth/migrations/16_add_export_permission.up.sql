-- Add permissions for the new export feature
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'export-laporan', true, false, false),
('Admin', 'export-laporan', true, false, false),
('Mitra Cabang', 'export-laporan', false, false, false),
('Cabang', 'export-laporan', false, false, false),
('Link', 'export-laporan', false, false, false)
ON CONFLICT (role, feature) DO NOTHING;
