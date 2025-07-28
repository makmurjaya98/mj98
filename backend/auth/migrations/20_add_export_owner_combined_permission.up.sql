-- Add permissions for the new Owner combined revenue export feature
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'export-owner-combined-report', true, false, false)
ON CONFLICT (role, feature) DO NOTHING;
