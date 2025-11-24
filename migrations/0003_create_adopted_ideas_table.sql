-- Adopted ideas table for tracking idea execution history
CREATE TABLE IF NOT EXISTS adopted_ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '実行待ち' CHECK (status IN ('実行待ち', '実行中', '中断', '完了')),
  note TEXT,
  adopted_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for filtering by user and status
CREATE INDEX IF NOT EXISTS idx_adopted_ideas_user_status ON adopted_ideas(user_id, status);

-- Index for filtering by idea
CREATE INDEX IF NOT EXISTS idx_adopted_ideas_idea ON adopted_ideas(idea_id);

-- Index for sorting by adoption date
CREATE INDEX IF NOT EXISTS idx_adopted_ideas_adopted_at ON adopted_ideas(adopted_at DESC);
