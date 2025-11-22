# エラーハンドリング仕様書

## 概要

Suggestman の統一的なエラー処理の仕様を定義します。
一貫性のあるエラーレスポンスとログ出力により、デバッグと運用を容易にします。

---

## エラーレスポンス形式

### 標準エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "hint": "Optional suggestion for fixing the error"
  }
}
```

**フィールド説明**:
- `success`: 常に `false`
- `error.code`: エラーコード（大文字スネークケース）
- `error.message`: ユーザー向けのエラーメッセージ
- `error.details`: エラーの詳細情報（オプション）
- `error.hint`: 解決のヒント（オプション）

---

## エラーコード体系

### HTTP ステータスコードとエラーコードの対応

#### 400 Bad Request - クライアントエラー

| エラーコード | 説明 | メッセージ例 |
|------------|------|------------|
| `VALIDATION_ERROR` | リクエストパラメータのバリデーションエラー | Invalid request parameters |
| `INVALID_FORMAT` | データ形式が不正 | Invalid JSON format |
| `MISSING_FIELD` | 必須フィールドが不足 | Required field missing |
| `INVALID_VALUE` | フィールドの値が不正 | Invalid value for field |

**レスポンス例**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "reason": "Must be a valid email address"
    }
  }
}
```

#### 401 Unauthorized - 認証エラー

| エラーコード | 説明 | メッセージ例 |
|------------|------|------------|
| `UNAUTHORIZED` | 認証が必要 | Authentication required |
| `TOKEN_INVALID` | トークンが不正 | Invalid authentication token |
| `TOKEN_EXPIRED` | トークンの有効期限切れ | Access token has expired |
| `TOKEN_MALFORMED` | トークンの形式が不正 | Malformed authentication token |
| `INVALID_CREDENTIALS` | 認証情報が不正 | Invalid email or password |

**レスポンス例**:
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired",
    "hint": "Use refresh token to obtain a new access token"
  }
}
```

#### 403 Forbidden - 認可エラー

| エラーコード | 説明 | メッセージ例 |
|------------|------|------------|
| `FORBIDDEN` | アクセス権限がない | You don't have permission to access this resource |
| `RESOURCE_ACCESS_DENIED` | リソースへのアクセスが拒否された | Access to this resource is denied |

#### 404 Not Found - リソース未検出

| エラーコード | 説明 | メッセージ例 |
|------------|------|------------|
| `NOT_FOUND` | リソースが見つからない | Resource not found |
| `USER_NOT_FOUND` | ユーザーが見つからない | User not found |
| `IDEA_NOT_FOUND` | アイデアが見つからない | Idea not found |

**レスポンス例**:
```json
{
  "success": false,
  "error": {
    "code": "IDEA_NOT_FOUND",
    "message": "Idea not found",
    "details": {
      "ideaId": "idea_xyz789"
    }
  }
}
```

#### 409 Conflict - リソース競合

| エラーコード | 説明 | メッセージ例 |
|------------|------|------------|
| `CONFLICT` | リソースの競合 | Resource conflict |
| `EMAIL_ALREADY_EXISTS` | メールアドレスが既に登録済み | Email address already registered |
| `DUPLICATE_ENTRY` | 重複したエントリ | Duplicate entry detected |

**レスポンス例**:
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Email address already registered",
    "hint": "Try logging in or use password reset"
  }
}
```

#### 429 Too Many Requests - レート制限

| エラーコード | 説明 | メッセージ例 |
|------------|------|------------|
| `RATE_LIMIT_EXCEEDED` | レート制限超過 | Too many requests |

**レスポンス例**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

**レスポンスヘッダー**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642252800
Retry-After: 60
```

#### 500 Internal Server Error - サーバーエラー

| エラーコード | 説明 | メッセージ例 |
|------------|------|----------||
| `INTERNAL_ERROR` | 内部サーバーエラー | Internal server error |
| `DATABASE_ERROR` | データベースエラー | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 外部サービスエラー | External service unavailable |

**レスポンス例**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "details": {
      "requestId": "req_abc123"
    }
  }
}
```

**注意**: 本番環境では内部エラーの詳細を露出しない

---

## バリデーションエラーの詳細

### 複数フィールドのバリデーションエラー

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Multiple validation errors occurred",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Must be a valid email address"
        },
        {
          "field": "password",
          "message": "Must be at least 8 characters"
        }
      ]
    }
  }
}
```

---

## ログ出力仕様

### ログレベル

| レベル | 用途 | 例 |
|--------|------|-----|
| `ERROR` | エラー発生時 | データベース接続エラー、予期しない例外 |
| `WARN` | 警告 | レート制限接近、非推奨APIの使用 |
| `INFO` | 通常の情報 | リクエスト受信、処理完了 |
| `DEBUG` | デバッグ情報 | 内部状態、変数の値 |

### ログ形式（JSON）

```json
{
  "timestamp": "2025-01-15T10:00:00.000Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "context": {
    "userId": "user_abc123",
    "requestId": "req_xyz789",
    "method": "POST",
    "path": "/api/ideas",
    "statusCode": 500
  },
  "error": {
    "name": "ConnectionError",
    "message": "Failed to connect to database",
    "stack": "..."
  }
}
```

### 機密情報の除外

ログに含めてはいけない情報：
- ❌ パスワード（平文・ハッシュ問わず）
- ❌ JWT トークン
- ❌ API キー、シークレット
- ❌ クレジットカード情報
- ❌ 個人を特定できる詳細情報（フルネーム、住所など）

含めても良い情報：
- ✅ ユーザー ID
- ✅ リクエスト ID
- ✅ エラーコード
- ✅ タイムスタンプ

---

## エラーハンドリングパターン

### 1. グローバルエラーハンドラー

```typescript
app.onError((err, c) => {
  console.error({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: err.message,
    context: {
      method: c.req.method,
      path: c.req.path,
      requestId: c.get('requestId'),
      userId: c.get('userId'),
    },
    error: {
      name: err.name,
      stack: err.stack,
    },
  })

  // 本番環境では詳細を隠す
  const isProduction = c.env.ENVIRONMENT === 'production'

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isProduction
          ? 'An unexpected error occurred'
          : err.message,
        details: isProduction ? undefined : { stack: err.stack },
      },
    },
    500
  )
})
```

### 2. カスタムエラークラス

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: any,
    public hint?: string
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        hint: this.hint,
      },
    }
  }
}

// 使用例
throw new AppError(
  'IDEA_NOT_FOUND',
  404,
  'Idea not found',
  { ideaId: 'idea_123' }
)
```

### 3. バリデーションエラー

```typescript
class ValidationError extends AppError {
  constructor(errors: Array<{ field: string; message: string }>) {
    super(
      'VALIDATION_ERROR',
      400,
      'Validation failed',
      { errors }
    )
    this.name = 'ValidationError'
  }
}
```

---

## リトライポリシー

### クライアント側のリトライ

**リトライ対象のステータスコード**:
- `500 Internal Server Error`
- `502 Bad Gateway`
- `503 Service Unavailable`
- `504 Gateway Timeout`

**リトライ戦略**:
- 最大リトライ回数: 3回
- バックオフ: 指数バックオフ（1秒、2秒、4秒）
- ジッター: ランダムな遅延を追加（衝突回避）

**リトライしてはいけないステータスコード**:
- `400 Bad Request` （リクエスト修正が必要）
- `401 Unauthorized` （認証が必要）
- `403 Forbidden` （権限がない）
- `404 Not Found` （リソースが存在しない）
- `409 Conflict` （競合エラー）
- `429 Too Many Requests` （レート制限、Retry-After に従う）

---

## モニタリングとアラート

### エラー率の監視

**メトリクス**:
- 全体のエラー率（4xx + 5xx）
- 5xx エラー率（サーバー側エラー）
- エンドポイントごとのエラー率

**アラート条件**:
- 5xx エラー率が 1% 超過
- 特定エンドポイントのエラー率が 5% 超過
- レート制限エラーが急増（前時間比 50% 増）

### エラートラッキング

**ツール**:
- Sentry（エラートラッキング）
- Cloudflare Logs（ログ集約）
- Grafana（可視化）

**トラッキング項目**:
- エラーの頻度
- 影響を受けたユーザー数
- エラーのスタックトレース
- 再現手順

---

## テストケース

### エラーハンドリングのテスト

- ✅ バリデーションエラーが正しく返される
- ✅ 認証エラーが正しく返される
- ✅ リソース未検出エラーが正しく返される
- ✅ レート制限エラーが正しく返される
- ✅ サーバーエラーが正しくログ出力される
- ✅ 本番環境でスタックトレースが露出しない
- ✅ ログに機密情報が含まれない

---

## ベストプラクティス

### Do's ✅
- 一貫性のあるエラーレスポンス形式を使用
- エラーコードで機械的に処理可能にする
- ユーザーにとって理解しやすいメッセージ
- 適切な HTTP ステータスコードを使用
- 機密情報をログに出力しない
- エラーを適切にログ出力する

### Don'ts ❌
- スタックトレースを本番環境で露出しない
- エラーメッセージに機密情報を含めない
- 全てのエラーを 500 で返さない
- エラーを握りつぶさない（silent failure）
- エラーログに個人情報を含めない

---

## エラーメッセージの多言語対応（将来）

### 実装方針
1. エラーコードは英語で統一
2. メッセージは Accept-Language ヘッダーに基づいて多言語化
3. 翻訳ファイルを別途管理

**例**:
```typescript
const messages = {
  en: {
    VALIDATION_ERROR: 'Invalid request parameters',
  },
  ja: {
    VALIDATION_ERROR: 'リクエストパラメータが不正です',
  },
}
```
