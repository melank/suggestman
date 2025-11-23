-- Ideas table for user's "やりたいこと"
CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  tags TEXT,
  note TEXT,
  estimated_minutes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Composite index for faster lookups
-- user_id でフィルタリングし、created_at でソートするクエリを最適化
CREATE INDEX IF NOT EXISTS idx_ideas_user_created ON ideas(user_id, created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS trigger_ideas_updated_at
AFTER UPDATE ON ideas
FOR EACH ROW
BEGIN
  UPDATE ideas SET updated_at = datetime('now') WHERE rowid = NEW.rowid;
END;
