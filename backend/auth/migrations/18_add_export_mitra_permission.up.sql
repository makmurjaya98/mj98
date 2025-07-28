-- Add permissions for the new Mitra Cabang export feature
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'export-mitra-report', true, false, false),
('Admin', 'export-mitra-report', true, false, false)
ON CONFLICT (role, feature) DO NOTHING;
