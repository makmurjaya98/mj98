-- Add permissions for new features
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'log-management', true, false, false),
('Admin', 'log-management', true, false, false),
('Mitra Cabang', 'log-management', false, false, false),
('Cabang', 'log-management', false, false, false),
('Link', 'log-management', false, false, false)
ON CONFLICT (role, feature) DO NOTHING;
