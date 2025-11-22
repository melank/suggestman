CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_suggested_at TEXT,
  snoozed_until TEXT
);

CREATE TRIGGER IF NOT EXISTS trigger_ideas_updated_at
AFTER UPDATE ON ideas
FOR EACH ROW
BEGIN
  UPDATE ideas SET updated_at = CURRENT_TIMESTAMP WHERE rowid = NEW.rowid;
END;
