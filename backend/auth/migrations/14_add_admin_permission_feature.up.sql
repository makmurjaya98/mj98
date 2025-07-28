-- Add permission for the new admin access management feature, accessible only by Owner
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'admin-permission-management', true, true, false)
ON CONFLICT (role, feature) DO NOTHING;
