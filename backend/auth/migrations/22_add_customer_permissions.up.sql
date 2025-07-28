-- Add permissions for the new customer management feature
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'customer-management', true, true, true),
('Admin', 'customer-management', true, true, true),
('Mitra Cabang', 'customer-management', true, false, false),
('Cabang', 'customer-management', true, false, false),
('Link', 'customer-management', true, true, true)
ON CONFLICT (role, feature) DO NOTHING;

-- Add permissions for the new coupon management feature
INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete) VALUES
('Owner', 'coupon-management', true, true, true),
('Admin', 'coupon-management', true, true, true),
('Mitra Cabang', 'coupon-management', false, false, false),
('Cabang', 'coupon-management', false, false, false),
('Link', 'coupon-management', true, false, false) -- Links can view coupons
ON CONFLICT (role, feature) DO NOTHING;
