# データ仕様書

## 概要

Suggestman のデータストレージ戦略と構造を定義します。
プライマリストレージとして **Cloudflare Workers KV** を使用し、オプションで **Cloudflare D1** を統計情報等に使用します。

---

## Workers KV データ構造

### KV の特性
- **Eventually Consistent**: グローバル分散ストレージのため、書き込み後すぐに全リージョンで反映されない可能性あり
- **Value サイズ制限**: 最大 25MB（実際には数KB以下を推奨）
- **TTL サポート**: 自動的なデータ削除が可能
- **低レイテンシー**: エッジで高速読み取り

### キー設計の原則
1. **プレフィックスベース**: 用途ごとにプレフィックスを使用（例: `user:`, `ideas:`）
2. **階層構造**: コロン（`:`）で階層を表現
3. **ID の一意性**: UUID v4 またはプレフィックス付きランダム文字列

---

## 1. ユーザーデータ

### 1.1 ユーザー情報

**Key**: `user:<userId>`

**Value** (JSON):
```json
{
  "id": "user_abc123def456",
  "email": "user@example.com",
  "name": "User Name",
  "passwordHash": "$2b$10$...",
  "githubId": "12345678",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "metadata": {
    "lastLoginAt": "2025-01-15T10:00:00Z",
    "loginCount": 42
  }
}
```

**フィールド仕様**:
- `id`: ユーザー ID（必須、ユニーク、プレフィックス: `user_`）
- `email`: メールアドレス（メール認証の場合は必須）
- `name`: 表示名（必須、最大100文字）
- `passwordHash`: bcrypt ハッシュ（メール認証の場合は必須）
- `githubId`: GitHub ユーザー ID（GitHub認証の場合は必須）
- `createdAt`: アカウント作成日時（ISO 8601形式）
- `updatedAt`: 最終更新日時（ISO 8601形式）
- `metadata`: メタデータ（オプショナル）

**制約**:
- `email` または `githubId` のいずれか必須
- `passwordHash` はメール認証ユーザーのみ設定
- ユーザー削除時は関連する全データも削除する必要あり

---

### 1.2 メールアドレスからユーザー ID へのマッピング

**Key**: `email:<email>`

**Value** (String):
```
user_abc123def456
```

**目的**: メールアドレスからユーザー ID を高速に検索

**TTL**: なし（ユーザー削除時に明示的に削除）

---

### 1.3 GitHub ID からユーザー ID へのマッピング

**Key**: `github:<githubId>`

**Value** (String):
```
user_abc123def456
```

**目的**: GitHub ID からユーザー ID を高速に検索

**TTL**: なし（ユーザー削除時に明示的に削除）

---

## 2. セッション管理

### 2.1 セッション情報

**Key**: `session:<sessionId>`

**Value** (JSON):
```json
{
  "userId": "user_abc123def456",
  "createdAt": "2025-01-15T10:00:00Z",
  "expiresAt": "2025-01-22T10:00:00Z",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```

**フィールド仕様**:
- `userId`: ユーザー ID（必須）
- `createdAt`: セッション作成日時
- `expiresAt`: 有効期限
- `userAgent`: User-Agent 文字列（セキュリティ用）
- `ipAddress`: IP アドレス（セキュリティ用）

**TTL**: 7日間（604800秒）

**セキュリティ要件**:
- sessionId は暗号学的に安全な乱数（最低128ビット）
- ログアウト時は明示的に削除
- 有効期限切れは TTL で自動削除

---

### 2.2 リフレッシュトークン

**Key**: `refresh:<tokenId>`

**Value** (JSON):
```json
{
  "userId": "user_abc123def456",
  "sessionId": "session_xyz789",
  "createdAt": "2025-01-15T10:00:00Z",
  "expiresAt": "2025-02-15T10:00:00Z"
}
```

**TTL**: 30日間（2592000秒）

**制約**:
- リフレッシュトークンは1回のみ使用可能（使用後は削除）
- 新しいアクセストークン発行時に新しいリフレッシュトークンも発行

---

## 3. アイデア管理

### 3.1 ユーザーのアイデア一覧

**Key**: `ideas:<userId>`

**Value** (JSON Array):
```json
[
  {
    "id": "idea_xyz789abc123",
    "title": "映画を観る",
    "tags": ["indoor", "entertainment"],
    "note": "見たい映画リストから選ぶ",
    "estimatedMinutes": 120,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  },
  {
    "id": "idea_aaa111bbb222",
    "title": "散歩する",
    "tags": ["outdoor", "physical"],
    "note": "近所の公園へ",
    "estimatedMinutes": 30,
    "createdAt": "2025-01-14T09:00:00Z",
    "updatedAt": "2025-01-14T09:00:00Z"
  }
]
```

**フィールド仕様**:
- `id`: アイデア ID（必須、ユニーク、プレフィックス: `idea_`）
- `title`: アイデアのタイトル（必須、最大200文字）
- `tags`: タグの配列（オプショナル、各タグ最大50文字、最大10個）
- `note`: メモ（オプショナル、最大1000文字）
- `estimatedMinutes`: 所要時間の見積もり（オプショナル、正の整数、最大1440）
- `createdAt`: 作成日時（ISO 8601形式）
- `updatedAt`: 最終更新日時（ISO 8601形式）

**制約**:
- 配列全体のサイズは 100KB 以下を推奨
- アイデア数が多い場合（目安: 1000件以上）はページネーション実装を検討

**CRUD 操作**:
- **Create**: 配列に新しいアイデアを追加し、全体を書き込み
- **Read**: 全アイデアを取得
- **Update**: 該当アイデアを更新し、全体を書き込み
- **Delete**: 該当アイデアを削除し、全体を書き込み

---

## 4. 提案履歴

### 4.1 提案履歴データ

**Key**: `history:<userId>`

**Value** (JSON Array):
```json
[
  {
    "ideaId": "idea_xyz789abc123",
    "suggestedAt": "2025-01-15T10:00:00Z",
    "context": {
      "mood": "low_energy",
      "availableMinutes": 60,
      "includeTags": ["indoor"]
    },
    "feedback": {
      "action": "accepted",
      "rating": 5,
      "comment": "とても良い提案でした",
      "submittedAt": "2025-01-15T10:05:00Z"
    },
    "matchScore": 0.85
  }
]
```

**フィールド仕様**:
- `ideaId`: 提案されたアイデア ID（必須）
- `suggestedAt`: 提案日時（必須）
- `context`: 提案時のコンテキスト（オプショナル）
- `feedback`: ユーザーフィードバック（オプショナル）
- `matchScore`: マッチスコア（0.0〜1.0）

**データ保持ポリシー**:
- 直近 100件 のみ保持
- 古い履歴は定期的にクリーンアップ
- クリーンアップは提案取得時に実行（バックグラウンド処理）

**TTL**: なし（明示的なクリーンアップで管理）

---

## 5. クールダウン管理

### 5.1 アイデアごとのクールダウン

**Key**: `cooldown:<userId>:<ideaId>`

**Value** (String):
```
2025-01-15T10:00:00Z
```

**意味**: このアイデアが最後に提案された日時

**TTL**: 7日間（604800秒）

**動作**:
1. アイデアを提案したらこのキーを作成
2. 提案アルゴリズムでこのキーの存在をチェック
3. 存在する場合は提案候補から除外
4. 7日後に自動削除され、再度提案可能になる

---

## 6. タグ管理（将来拡張）

### 6.1 タグマスター（オプション）

**Key**: `tags:master`

**Value** (JSON Array):
```json
[
  {
    "name": "indoor",
    "displayName": "インドア",
    "category": "location",
    "color": "#FF5733"
  },
  {
    "name": "outdoor",
    "displayName": "アウトドア",
    "category": "location",
    "color": "#33FF57"
  }
]
```

**目的**:
- タグの統一的な管理
- UI での表示用メタデータ
- タグのサジェスト機能

**注**: MVP では実装しない（将来の拡張として検討）

---

## Cloudflare D1 スキーマ（オプション）

D1 は統計情報やアーカイブ用途で使用する可能性があります。

### users テーブル

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  github_id TEXT UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_github_id ON users(github_id);
```

### suggestion_stats テーブル（統計用）

```sql
CREATE TABLE suggestion_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  idea_id TEXT NOT NULL,
  suggested_at TEXT NOT NULL,
  action TEXT CHECK(action IN ('accepted', 'skipped', 'snoozed')),
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  match_score REAL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_suggestion_stats_user_id ON suggestion_stats(user_id);
CREATE INDEX idx_suggestion_stats_suggested_at ON suggestion_stats(suggested_at);
```

---

## データマイグレーション戦略

### KV データのマイグレーション
KV にはマイグレーション機能がないため、以下の戦略を採用：

1. **バージョニング**: データにバージョンフィールドを追加
   ```json
   {
     "_version": "1.0",
     "id": "user_123",
     ...
   }
   ```

2. **読み取り時マイグレーション**: 古いバージョンのデータを読み取った場合、その場で変換して書き戻す

3. **バッチマイグレーション**: Wrangler スクリプトで全データを一括変換（必要な場合のみ）

### D1 のマイグレーション
Wrangler の標準マイグレーション機能を使用：

```bash
npx wrangler d1 migrations create suggestman add_new_column
npx wrangler d1 migrations apply suggestman --local
```

---

## データバックアップとリストア

### KV のバックアップ
1. **定期バックアップ**: Wrangler CLI でキー一覧を取得し、値をエクスポート
   ```bash
   wrangler kv:key list --namespace-id=<id> > keys.json
   wrangler kv:key get <key> --namespace-id=<id> > data/<key>.json
   ```

2. **リストア**: エクスポートしたデータを再度書き込み
   ```bash
   wrangler kv:key put <key> --path=data/<key>.json --namespace-id=<id>
   ```

### D1 のバックアップ
Cloudflare のダッシュボードから自動バックアップを有効化。

---

## パフォーマンス最適化

### 読み取り最適化
1. **キャッシュ戦略**: 頻繁に読み取るデータ（ユーザー情報など）はメモリキャッシュを検討
2. **バッチ読み取り**: 複数のキーを同時に読み取る場合は `Promise.all` を使用

### 書き込み最適化
1. **楽観的更新**: UI で即座に反映し、バックグラウンドで KV に書き込み
2. **デバウンス**: 連続する書き込みをまとめる（例: アイデア編集中）

### サイズ最適化
1. **JSON 最小化**: 不要な空白を削除
2. **フィールド省略**: null や undefined のフィールドは省略
3. **圧縮**: 大きなデータは gzip 圧縮を検討（ただし CPU コスト増）

---

## データ整合性

### Eventually Consistent への対応
1. **楽観的ロック**: 更新時にバージョン番号を使用
2. **冪等性**: 同じ操作を複数回実行しても安全に
3. **リトライロジック**: 競合検出時は指数バックオフでリトライ

### トランザクション
KV にはトランザクション機能がないため：
- 複数キーの更新が必要な場合は、失敗時のロールバック処理を実装
- クリティカルなデータは D1 を検討

---

## セキュリティ

### データ暗号化
- **転送中**: HTTPS で自動的に暗号化
- **保存時**: Cloudflare が自動的に暗号化

### アクセス制御
- ユーザーは自分のデータのみアクセス可能
- KV キーにユーザー ID を含めることで分離

### データ削除
- ユーザーアカウント削除時は全関連データを削除
- GDPR 準拠のため、削除リクエストから30日以内に完全削除

---

## モニタリング

### メトリクス
- KV 読み取り回数（リクエストごと）
- KV 書き込み回数（リクエストごと）
- データサイズ（ユーザーごと）
- エラー率（KV操作失敗）

### アラート
- KV 操作エラー率が 1% 超過
- 単一ユーザーのデータサイズが 100KB 超過
- KV レイテンシーが 100ms 超過

---

## データ設計の原則

1. **ユーザー分離**: 全データはユーザー ID で分離
2. **サイズ制限**: 単一 Value は 100KB 以下を目標
3. **TTL 活用**: 一時データは必ず TTL を設定
4. **冗長性最小化**: 同じデータを複数箇所に保存しない（マッピングを除く）
5. **将来拡張性**: スキーマにバージョンフィールドを含める
