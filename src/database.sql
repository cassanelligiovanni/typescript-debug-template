CREATE TABLE IF NOT EXISTS connections (
  id SERIAL PRIMARY KEY,
  app_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_id ON connections(user_id);
CREATE UNIQUE INDEX idx_app_user ON connections(app_id, user_id);

