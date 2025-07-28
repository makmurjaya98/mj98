-- Add permissions for the new Owner revenue export feature
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'export-owner-report', true, false, false)
ON CONFLICT (role, feature) DO NOTHING;
