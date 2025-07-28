-- Add permissions for new features
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'excel-management', true, true, false),
('Admin', 'excel-management', true, true, false),
('Mitra Cabang', 'excel-management', false, false, false),
('Cabang', 'excel-management', false, false, false),
('Link', 'excel-management', false, false, false),

('Owner', 'user-management', true, true, true),
('Admin', 'user-management', true, true, false),
('Mitra Cabang', 'user-management', false, false, false),
('Cabang', 'user-management', false, false, false),
('Link', 'user-management', false, false, false)
ON CONFLICT (role, feature) DO NOTHING;
