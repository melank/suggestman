# データ仕様書

## 概要

Suggestman のデータストレージ戦略と構造を定義します。
プライマリストレージとして **Cloudflare D1** (SQLite) を使用し、クールダウン管理のみ **Cloudflare Workers KV** を使用します。

---

## ストレージ戦略

### Cloudflare D1 (プライマリストレージ)
- **用途**: ユーザー情報、アイデア、提案履歴
- **特性**:
  - ACID トランザクション対応
  - SQL による柔軟なクエリ
  - リレーショナルデータの管理に最適
  - 1GB までの無料枠（以降は従量課金）

### Cloudflare Workers KV (補助ストレージ)
- **用途**: クールダウン管理（一時データ）
- **特性**:
  - TTL による自動削除
  - エッジでの高速読み取り
  - Eventually Consistent
- **キー設計**: `cooldown:<userId>:<ideaId>`

### JWT (認証トークン)
- **用途**: セッション管理
- **特性**:
  - ステートレス認証
  - Cookie に保存（HttpOnly, Secure, SameSite=Lax）
  - サーバー側にセッション情報を保持しない

---

## Cloudflare D1 スキーマ

### users テーブル

ユーザーアカウント情報を管理します。

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  github_id TEXT UNIQUE,
  github_username TEXT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_github_id ON users(github_id);
```

**フィールド仕様**:
- `id`: ユーザー ID（必須、ユニーク、プレフィックス: `user_`）
- `email`: メールアドレス（メール認証の場合は必須、ユニーク）
- `password_hash`: bcrypt ハッシュ（メール認証の場合は必須、GitHub 認証ユーザーは NULL 可）
- `github_id`: GitHub ユーザー ID（GitHub 認証の場合は必須、ユニーク）
- `github_username`: GitHub ユーザー名（表示用）
- `name`: 表示名（必須、最大100文字）
- `created_at`: アカウント作成日時（ISO 8601形式、自動設定）
- `updated_at`: 最終更新日時（ISO 8601形式、自動設定）

**制約**:
- `email` または `github_id` のいずれか必須
- `password_hash` はメール認証ユーザーのみ必須（GitHub 認証ユーザーも後から設定可能）
- ユーザー削除時は関連する全データも CASCADE 削除

**インデックス戦略**:
- `email` でのログイン検索を高速化
- `github_id` での OAuth コールバック検索を高速化

---

### ideas テーブル

ユーザーが登録した「やりたいこと」を管理します。

```sql
CREATE TABLE ideas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  tags TEXT,
  note TEXT,
  estimated_minutes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_created_at ON ideas(created_at);
```

**フィールド仕様**:
- `id`: アイデア ID（必須、ユニーク、プレフィックス: `idea_`）
- `user_id`: ユーザー ID（必須、外部キー）
- `title`: アイデアのタイトル（必須、最大200文字）
- `tags`: JSON 配列形式のタグリスト（例: `["indoor", "entertainment"]`）
- `note`: メモ（オプショナル、最大1000文字）
- `estimated_minutes`: 所要時間の見積もり（オプショナル、正の整数、最大1440）
- `created_at`: 作成日時（ISO 8601形式、自動設定）
- `updated_at`: 最終更新日時（ISO 8601形式、自動設定）

**制約**:
- `user_id` は users テーブルへの外部キー
- ユーザー削除時に CASCADE で削除

**インデックス戦略**:
- `user_id` でのアイデア一覧取得を高速化
- `created_at` での新しいアイデアから順に取得

**タグの扱い**:
- SQLite には配列型がないため、JSON 文字列として保存
- クエリ例: `SELECT * FROM ideas WHERE tags LIKE '%"indoor"%'`
- 将来的にタグ検索が頻繁になる場合は、別テーブル `idea_tags` を検討

---

### suggestion_history テーブル

提案履歴を記録します。

```sql
CREATE TABLE suggestion_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  idea_id TEXT NOT NULL,
  suggested_at TEXT NOT NULL DEFAULT (datetime('now')),
  context_mood TEXT,
  context_available_minutes INTEGER,
  context_include_tags TEXT,
  feedback_action TEXT CHECK(feedback_action IN ('accepted', 'skipped', 'snoozed')),
  feedback_rating INTEGER CHECK(feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  feedback_submitted_at TEXT,
  match_score REAL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
);

CREATE INDEX idx_suggestion_history_user_id ON suggestion_history(user_id);
CREATE INDEX idx_suggestion_history_suggested_at ON suggestion_history(suggested_at);
CREATE INDEX idx_suggestion_history_idea_id ON suggestion_history(idea_id);
```

**フィールド仕様**:
- `id`: 自動採番の履歴 ID
- `user_id`: ユーザー ID（必須、外部キー）
- `idea_id`: 提案されたアイデア ID（必須、外部キー）
- `suggested_at`: 提案日時（ISO 8601形式、自動設定）
- `context_mood`: 提案時の気分（例: "low_energy", "high_energy"）
- `context_available_minutes`: 提案時の利用可能時間（分）
- `context_include_tags`: 提案時の指定タグ（JSON 配列形式）
- `feedback_action`: ユーザーのアクション（"accepted", "skipped", "snoozed"）
- `feedback_rating`: ユーザーの評価（1〜5）
- `feedback_comment`: ユーザーのコメント（最大500文字）
- `feedback_submitted_at`: フィードバック送信日時
- `match_score`: マッチスコア（0.0〜1.0）

**制約**:
- `user_id` と `idea_id` は外部キー
- ユーザーまたはアイデア削除時に CASCADE で削除

**インデックス戦略**:
- `user_id` でのユーザーごとの履歴取得を高速化
- `suggested_at` での時系列ソート
- `idea_id` での特定アイデアの提案履歴取得

**データ保持ポリシー**:
- **直近 100件 のみ保持**: 提案取得時に古い履歴を自動クリーンアップ
- クリーンアップクエリ例:
  ```sql
  DELETE FROM suggestion_history
  WHERE id NOT IN (
    SELECT id FROM suggestion_history
    WHERE user_id = ?
    ORDER BY suggested_at DESC
    LIMIT 100
  ) AND user_id = ?;
  ```

---

## Cloudflare Workers KV スキーマ

### クールダウン管理

**Key**: `cooldown:<userId>:<ideaId>`

**Value** (String):
```
2025-01-15T10:00:00Z
```

**意味**: このアイデアが最後に提案された日時

**TTL**: 7日間（604800秒）

**動作**:
1. アイデアを提案したらこのキーを作成（TTL: 7日間）
2. 提案アルゴリズムでこのキーの存在をチェック
3. 存在する場合は提案候補から除外
4. 7日後に自動削除され、再度提案可能になる

**実装例**:
```typescript
// クールダウンの設定
await env.COOLDOWN_KV.put(
  `cooldown:${userId}:${ideaId}`,
  new Date().toISOString(),
  { expirationTtl: 604800 } // 7日間
);

// クールダウンのチェック
const cooldown = await env.COOLDOWN_KV.get(`cooldown:${userId}:${ideaId}`);
if (cooldown) {
  // このアイデアはクールダウン中
}
```

---

## データマイグレーション戦略

### D1 マイグレーション

Wrangler の標準マイグレーション機能を使用：

```bash
# マイグレーションファイルの作成
npx wrangler d1 migrations create suggestman add_new_column

# ローカルでマイグレーション適用
npx wrangler d1 migrations apply suggestman --local

# 本番環境でマイグレーション適用
npx wrangler d1 migrations apply suggestman
```

**マイグレーションファイルの構成**:
- `migrations/0001_initial_schema.sql`: 初期スキーマ
- `migrations/0002_add_github_auth.sql`: GitHub 認証フィールド追加
- 以降、必要に応じて追加

**マイグレーションのベストプラクティス**:
1. **後方互換性**: 既存データを壊さない変更を優先
2. **段階的適用**: 大きな変更は複数のマイグレーションに分割
3. **ロールバック計画**: 各マイグレーションに対応するロールバック SQL を用意
4. **テスト**: ローカル環境で十分にテスト後、本番適用

### KV マイグレーション

KV にはマイグレーション機能がないが、以下の対応で十分：
- TTL で自動削除されるため、スキーマ変更の影響は限定的
- キー設計を変更する場合は、古いキーの削除スクリプトを実行

---

## データバックアップとリストア

### D1 のバックアップ

**自動バックアップ**:
- Cloudflare ダッシュボードから自動バックアップを有効化
- ポイントインタイムリカバリ（PITR）に対応

**手動バックアップ**:
```bash
# データのエクスポート（CSV 形式）
npx wrangler d1 execute suggestman --command "SELECT * FROM users" > backup_users.csv
npx wrangler d1 execute suggestman --command "SELECT * FROM ideas" > backup_ideas.csv
```

**リストア**:
```bash
# SQL ファイルから復元
npx wrangler d1 execute suggestman --file=backup.sql
```

### KV のバックアップ

クールダウンデータは一時的なものなので、定期バックアップは不要。

---

## パフォーマンス最適化

### 読み取り最適化

1. **インデックスの活用**:
   - 頻繁に使用するクエリにインデックスを設定済み
   - `EXPLAIN QUERY PLAN` でクエリプランを確認

2. **ページネーション**:
   - アイデア一覧は LIMIT + OFFSET でページング
   - 提案履歴は最新100件のみ取得

3. **キャッシュ戦略**:
   - ユーザー情報は Workers のメモリにキャッシュ（リクエストスコープ）
   - タグマスターなど静的データは CDN キャッシュ

### 書き込み最適化

1. **トランザクション**:
   - 複数テーブルの更新は BEGIN TRANSACTION で一括実行
   - ロールバック機能で一貫性を保証

2. **バッチ処理**:
   - 履歴のクリーンアップは提案取得時にまとめて実行
   - 古いデータの削除は定期的な Cron Trigger で実行

### クエリ最適化

**良い例**:
```sql
-- インデックスを使用
SELECT * FROM ideas WHERE user_id = ? ORDER BY created_at DESC LIMIT 10;
```

**悪い例**:
```sql
-- フルスキャン（遅い）
SELECT * FROM ideas WHERE title LIKE '%検索%';
```

---

## データ整合性

### トランザクション

D1 は SQLite ベースなので、ACID トランザクションに対応：

```typescript
await env.DB.batch([
  env.DB.prepare("INSERT INTO users (id, email, name) VALUES (?, ?, ?)").bind(userId, email, name),
  env.DB.prepare("INSERT INTO ideas (id, user_id, title) VALUES (?, ?, ?)").bind(ideaId, userId, title)
]);
```

**失敗時のロールバック**:
- `batch()` 内のいずれかが失敗すると、全体がロールバック
- 一貫性が保証される

### 外部キー制約

- `FOREIGN KEY` で参照整合性を保証
- `ON DELETE CASCADE` でユーザー削除時に関連データも自動削除

---

## セキュリティ

### データ暗号化

- **転送中**: HTTPS で自動的に暗号化
- **保存時**: Cloudflare が自動的に暗号化

### アクセス制御

- ユーザーは自分のデータのみアクセス可能
- SQL クエリで `WHERE user_id = ?` を必須化

### パスワード管理

- bcrypt でハッシュ化（ソルトラウンド: 10）
- 平文パスワードは保存しない

### データ削除

- ユーザーアカウント削除時は全関連データを CASCADE 削除
- GDPR 準拠のため、削除リクエストから30日以内に完全削除

---

## モニタリング

### メトリクス

- D1 クエリ実行回数（リクエストごと）
- D1 クエリレイテンシー（平均、P95、P99）
- KV 読み取り回数
- エラー率（D1/KV 操作失敗）
- ユーザー数、アイデア数、提案回数

### アラート

- D1 クエリエラー率が 1% 超過
- D1 クエリレイテンシーが 500ms 超過
- KV 操作エラー率が 1% 超過
- ディスク使用量が 80% 超過

---

## データ設計の原則

1. **正規化**: リレーショナルモデルを活用し、データの冗長性を最小化
2. **外部キー制約**: 参照整合性を保証
3. **インデックス**: 頻繁なクエリに対してインデックスを設定
4. **ユーザー分離**: 全データはユーザー ID で分離
5. **TTL 活用**: 一時データ（クールダウン）は KV の TTL で自動削除
6. **監査ログ**: 必要に応じて `created_at` と `updated_at` を記録

---

## 今後の拡張案

### タグマスター

タグを統一的に管理するためのテーブル（将来の拡張として検討）:

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_category ON tags(category);
```

### idea_tags 中間テーブル

多対多のリレーションで効率的なタグ検索を実現:

```sql
CREATE TABLE idea_tags (
  idea_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (idea_id, tag_id),
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_idea_tags_tag_id ON idea_tags(tag_id);
```

### 統計情報の集計

日次の統計情報を保存するテーブル:

```sql
CREATE TABLE daily_stats (
  date TEXT PRIMARY KEY,
  total_users INTEGER,
  active_users INTEGER,
  total_ideas INTEGER,
  total_suggestions INTEGER,
  acceptance_rate REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## まとめ

- **D1**: ユーザー、アイデア、提案履歴などの永続データ
- **KV**: クールダウン管理（TTL 7日間）
- **JWT**: ステートレス認証（Cookie に保存）

この設計により、シンプルで拡張性の高いデータ管理が可能になります。
