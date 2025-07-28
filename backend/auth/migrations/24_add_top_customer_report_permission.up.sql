-- Add permissions for the new top customer report feature
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'top-customer-report', true, false, false),
('Admin', 'top-customer-report', true, false, false),
('Mitra Cabang', 'top-customer-report', true, false, false),
('Cabang', 'top-customer-report', true, false, false),
('Link', 'top-customer-report', true, false, false)
ON CONFLICT (role, feature) DO NOTHING;
