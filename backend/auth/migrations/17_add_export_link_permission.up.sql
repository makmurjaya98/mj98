-- Add permissions for the new link-specific export feature
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'export-link-report', true, false, false),
('Admin', 'export-link-report', true, false, false),
('Mitra Cabang', 'export-link-report', true, false, false),
('Cabang', 'export-link-report', true, false, false),
('Link', 'export-link-report', true, false, false)
ON CONFLICT (role, feature) DO NOTHING;
