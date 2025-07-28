-- Add role and hierarchy columns to users table
ALTER TABLE users ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN username TEXT UNIQUE NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN id_number TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN address TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN phone_number TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'Link' CHECK (role IN ('Owner', 'Admin', 'Mitra Cabang', 'Cabang', 'Link'));
ALTER TABLE users ADD COLUMN parent_id BIGINT REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_parent_id ON users(parent_id);

-- Remove default constraints after adding columns
ALTER TABLE users ALTER COLUMN full_name DROP DEFAULT;
ALTER TABLE users ALTER COLUMN username DROP DEFAULT;
ALTER TABLE users ALTER COLUMN id_number DROP DEFAULT;
ALTER TABLE users ALTER COLUMN address DROP DEFAULT;
ALTER TABLE users ALTER COLUMN phone_number DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
