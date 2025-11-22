# API 仕様書

## 概要

Suggestman の REST API 仕様を定義します。全てのエンドポイントは JSON 形式でデータをやり取りします。

### ベース URL
- **ローカル開発**: `http://127.0.0.1:8787`
- **本番環境**: `https://suggestman.your-domain.com` (TBD)

### API バージョン
- **現在**: v1（パスに含めず、将来的に `/api/v1/` を検討）

### 共通ヘッダー
```
Content-Type: application/json
Accept: application/json
```

### 認証
認証が必要なエンドポイントは、以下のヘッダーで JWT トークンを送信：
```
Authorization: Bearer <access_token>
```

---

## 認証エンドポイント

### 1. POST /api/auth/signup

**概要**: メールアドレスとパスワードで新規ユーザー登録

**認証**: 不要

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "User Name"
}
```

**リクエストバリデーション**:
- `email`:
  - 必須
  - 有効なメールアドレス形式
  - 最大255文字
  - 既に登録済みのメールアドレスは不可
- `password`:
  - 必須
  - 最小8文字
  - 最大72文字（bcrypt の制限）
  - 英大文字、英小文字、数字、記号のうち3種類以上を含む
- `name`:
  - 必須
  - 最小1文字
  - 最大100文字

**成功レスポンス** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "name": "User Name",
      "createdAt": "2025-01-15T10:00:00Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: バリデーションエラー
- `409 Conflict`: メールアドレスが既に登録済み
- `500 Internal Server Error`: サーバーエラー

---

### 2. POST /api/auth/login

**概要**: メールアドレスとパスワードでログイン

**認証**: 不要

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**リクエストバリデーション**:
- `email`: 必須、有効なメールアドレス形式
- `password`: 必須

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "name": "User Name",
      "createdAt": "2025-01-15T10:00:00Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証情報が不正
- `500 Internal Server Error`: サーバーエラー

---

### 3. GET /api/auth/github

**概要**: GitHub OAuth 認証フローを開始

**認証**: 不要

**クエリパラメータ**: なし

**動作**:
1. GitHub OAuth 認証ページへリダイレクト
2. リダイレクト URL: `https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=user:email`

**レスポンス**: 302 Redirect

---

### 4. GET /api/auth/github/callback

**概要**: GitHub OAuth コールバック処理

**認証**: 不要

**クエリパラメータ**:
- `code`: GitHub から返される認証コード（必須）
- `state`: CSRF 対策用の state パラメータ（オプション）

**動作**:
1. GitHub から access_token を取得
2. GitHub API でユーザー情報を取得
3. ユーザー登録または既存ユーザーを特定
4. JWT トークンを生成
5. フロントエンドへリダイレクト、またはJSON レスポンス

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "name": "GitHub User",
      "githubId": "12345678",
      "createdAt": "2025-01-15T10:00:00Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: code パラメータが不正
- `401 Unauthorized`: GitHub 認証に失敗
- `500 Internal Server Error`: サーバーエラー

---

### 5. POST /api/auth/refresh

**概要**: アクセストークンをリフレッシュ

**認証**: 不要（リフレッシュトークンを使用）

**リクエスト**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: リフレッシュトークンが不正
- `401 Unauthorized`: トークンの有効期限切れ
- `500 Internal Server Error`: サーバーエラー

---

### 6. POST /api/auth/logout

**概要**: ログアウト（セッションを無効化）

**認証**: 必須

**リクエスト**: なし（Authorization ヘッダーのみ）

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

**エラーレスポンス**:
- `401 Unauthorized`: 認証トークンが不正
- `500 Internal Server Error`: サーバーエラー

---

## アイデア管理エンドポイント

### 7. POST /api/ideas

**概要**: 新しいアイデアを登録

**認証**: 必須

**リクエスト**:
```json
{
  "title": "映画を観る",
  "tags": ["indoor", "entertainment"],
  "note": "見たい映画リストから選ぶ",
  "estimatedMinutes": 120
}
```

**リクエストバリデーション**:
- `title`:
  - 必須
  - 最小1文字
  - 最大200文字
- `tags`:
  - オプション
  - 配列形式
  - 各タグは最大50文字
  - 最大10個まで
- `note`:
  - オプション
  - 最大1000文字
- `estimatedMinutes`:
  - オプション
  - 正の整数
  - 最大1440（24時間）

**成功レスポンス** (201 Created):
```json
{
  "success": true,
  "data": {
    "idea": {
      "id": "idea_xyz789",
      "title": "映画を観る",
      "tags": ["indoor", "entertainment"],
      "note": "見たい映画リストから選ぶ",
      "estimatedMinutes": 120,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証トークンが不正
- `500 Internal Server Error`: サーバーエラー

---

### 8. GET /api/ideas

**概要**: 登録済みアイデア一覧を取得

**認証**: 必須

**クエリパラメータ**:
- `tags`: タグでフィルタ（カンマ区切り、例: `tags=indoor,creative`）
- `limit`: 取得件数の上限（デフォルト: 50、最大: 100）
- `offset`: オフセット（ページネーション用、デフォルト: 0）
- `sort`: ソート順（`createdAt`, `-createdAt`, `title`, `-title`）

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "ideas": [
      {
        "id": "idea_xyz789",
        "title": "映画を観る",
        "tags": ["indoor", "entertainment"],
        "note": "見たい映画リストから選ぶ",
        "estimatedMinutes": 120,
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: クエリパラメータが不正
- `401 Unauthorized`: 認証トークンが不正
- `500 Internal Server Error`: サーバーエラー

---

### 9. GET /api/ideas/:id

**概要**: 特定のアイデアを取得

**認証**: 必須

**パスパラメータ**:
- `id`: アイデア ID（例: `idea_xyz789`）

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "idea": {
      "id": "idea_xyz789",
      "title": "映画を観る",
      "tags": ["indoor", "entertainment"],
      "note": "見たい映画リストから選ぶ",
      "estimatedMinutes": 120,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

**エラーレスポンス**:
- `401 Unauthorized`: 認証トークンが不正
- `404 Not Found`: アイデアが存在しない
- `500 Internal Server Error`: サーバーエラー

---

### 10. PUT /api/ideas/:id

**概要**: アイデアを更新

**認証**: 必須

**パスパラメータ**:
- `id`: アイデア ID

**リクエスト**:
```json
{
  "title": "映画を観る（更新版）",
  "tags": ["indoor", "entertainment", "relaxation"],
  "note": "新しいメモ",
  "estimatedMinutes": 90
}
```

**リクエストバリデーション**: POST /api/ideas と同様

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "idea": {
      "id": "idea_xyz789",
      "title": "映画を観る（更新版）",
      "tags": ["indoor", "entertainment", "relaxation"],
      "note": "新しいメモ",
      "estimatedMinutes": 90,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T11:00:00Z"
    }
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証トークンが不正
- `404 Not Found`: アイデアが存在しない
- `500 Internal Server Error`: サーバーエラー

---

### 11. DELETE /api/ideas/:id

**概要**: アイデアを削除

**認証**: 必須

**パスパラメータ**:
- `id`: アイデア ID

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "message": "Idea deleted successfully"
}
```

**エラーレスポンス**:
- `401 Unauthorized`: 認証トークンが不正
- `404 Not Found`: アイデアが存在しない
- `500 Internal Server Error`: サーバーエラー

---

## 提案エンドポイント

### 12. POST /api/suggestions

**概要**: コンテキストに基づいた提案を取得

**認証**: 必須

**リクエスト**:
```json
{
  "context": {
    "mood": "low_energy",
    "availableMinutes": 60,
    "includeTags": ["indoor"],
    "excludeTags": ["physical"],
    "excludeIdeaIds": ["idea_123"]
  }
}
```

**リクエストバリデーション**:
- `context.mood`:
  - オプション
  - 許可値: `high_energy`, `low_energy`, `creative`, `productive`, `social`, `solo`
- `context.availableMinutes`:
  - オプション
  - 正の整数
- `context.includeTags`:
  - オプション
  - 配列形式
- `context.excludeTags`:
  - オプション
  - 配列形式
- `context.excludeIdeaIds`:
  - オプション
  - 配列形式

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "data": {
    "suggestion": {
      "idea": {
        "id": "idea_xyz789",
        "title": "映画を観る",
        "tags": ["indoor", "entertainment"],
        "note": "見たい映画リストから選ぶ",
        "estimatedMinutes": 120
      },
      "motivationalMessage": "今が映画を楽しむ絶好のタイミングです！リラックスして楽しみましょう。",
      "matchScore": 0.85,
      "matchReasons": [
        "インドアのアクティビティを希望されています",
        "低エネルギーモードに適しています"
      ],
      "servedAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

**特殊なレスポンス**:

**提案可能なアイデアがない場合** (200 OK):
```json
{
  "success": true,
  "data": {
    "suggestion": null,
    "message": "現在の条件に合うアイデアが見つかりませんでした。条件を変更するか、新しいアイデアを追加してください。"
  }
}
```

**エラーレスポンス**:
- `400 Bad Request`: リクエストパラメータが不正
- `401 Unauthorized`: 認証トークンが不正
- `500 Internal Server Error`: サーバーエラー

---

### 13. POST /api/suggestions/:id/feedback

**概要**: 提案に対するフィードバックを送信

**認証**: 必須

**パスパラメータ**:
- `id`: 提案された アイデア ID

**リクエスト**:
```json
{
  "action": "accepted",
  "rating": 5,
  "comment": "とても良い提案でした"
}
```

**リクエストバリデーション**:
- `action`:
  - 必須
  - 許可値: `accepted`, `skipped`, `snoozed`
- `rating`:
  - オプション
  - 1〜5 の整数
- `comment`:
  - オプション
  - 最大500文字

**成功レスポンス** (200 OK):
```json
{
  "success": true,
  "message": "Feedback recorded successfully"
}
```

**エラーレスポンス**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証トークンが不正
- `404 Not Found`: アイデアが存在しない
- `500 Internal Server Error`: サーバーエラー

---

## レート制限

全エンドポイントに以下のレート制限を適用：

- **認証エンドポイント**: 5リクエスト/分/IP
- **その他のエンドポイント**: 60リクエスト/分/ユーザー

**レート制限超過時のレスポンス** (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

**レスポンスヘッダー**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642252800
```

---

## CORS設定

**許可するオリジン**:
- ローカル開発: `http://localhost:*`, `http://127.0.0.1:*`
- 本番環境: 設定したドメインのみ

**許可するメソッド**:
- `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

**許可するヘッダー**:
- `Content-Type`, `Authorization`, `X-Requested-With`

---

## バージョニング

現在は API バージョンをパスに含めませんが、将来的に破壊的変更が必要な場合は以下の形式を採用：

```
/api/v2/suggestions
```

非推奨の API は、少なくとも6ヶ月前に告知し、`Deprecation` ヘッダーで通知します。

---

## OpenAPI/Swagger 定義

将来的に OpenAPI 3.0 形式の仕様書を `specs/openapi.yaml` として追加予定。
Swagger UI を使った対話的な API ドキュメントを提供します。
