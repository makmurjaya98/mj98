CREATE TABLE IF NOT EXISTS log_aktivitas (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT now(),
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  username TEXT,
  role TEXT,
  aksi TEXT NOT NULL,
  deskripsi TEXT
);

CREATE INDEX idx_log_aktivitas_timestamp ON log_aktivitas(timestamp);
CREATE INDEX idx_log_aktivitas_user_id ON log_aktivitas(user_id);
CREATE INDEX idx_log_aktivitas_aksi ON log_aktivitas(aksi);
