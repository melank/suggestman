# Claude Code 開発ガイド - Suggestman

このドキュメントは、Claude Code を使って Suggestman プロジェクトを開発する際のガイドラインとコンテキストをまとめたものです。

## プロジェクト概要

Suggestman は、自由時間が突然生まれた瞬間に「本当にやりたいこと」を提示してくれるサジェスト専用アプリケーションです。

**コアコンセプト**: メモ帳との差分 = 最適なタイミングでの後押し

### 技術スタック
- **Runtime**: Cloudflare Workers
- **Framework**: Hono v4
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript
- **Linter/Formatter**: Biome
- **Node.js**: v22 (`.nvmrc` で管理)

## アーキテクチャ

### システム構成
```
Client → Cloudflare Workers (Hono) → Service Layer → Repository Layer → D1 Storage
```

### 主要コンポーネント
- **ルート層** (`src/routes/`): Hono によるルーティング定義とリクエストハンドラ
- **サービス層** (`src/services/`): ビジネスロジック、提案ロジック、フィルタリング
- **リポジトリ層** (`src/repositories/`): データアクセス層（D1 データベースへのアクセスを抽象化）
- **ストレージ層**: D1 によるアイデア管理、提案履歴

### 🚫 Hono ベストプラクティス - Controller パターンの禁止

**重要**: Hono 公式ドキュメント ([Best Practices](https://hono.dev/docs/guides/best-practices)) では、**「可能な限り、Rails のような Controller を作らないでください」**と明記されています。

#### なぜ Controller を使わないのか

Hono で Controller クラスを作ると、**型推論が壊れる**という問題があります：

```typescript
// ❌ Controller パターン（型推論が効かない）
export class IdeasController {
  static async get(c: Context) {
    const id = c.req.param('id')  // 型推論できない！
    // ...
  }
}

// ✅ 推奨パターン（型推論が効く）
app.get('/ideas/:id', (c) => {
  const id = c.req.param('id')  // 型が自動的に推論される
  // ...
})
```

パスパラメータの型を Controller で推論させるには、複雑な Generics を書く必要があり、コードが煩雑になります。

#### 推奨パターン

Hono では `app.route()` を使ってルートファイルを分割し、**ルートファイルに直接ハンドラを記述**します：

```typescript
// src/routes/ideas.ts
import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'
import { authMiddleware, type AuthContext } from '../services/middleware'
import { IdeaRepository } from '../repositories/IdeaRepository'

const app = new Hono<{ Bindings: Bindings } & AuthContext>()

// 認証ミドルウェア適用
app.use('/*', authMiddleware)

// アイデア一覧取得（ハンドラを直接記述）
app.get('/', async (c) => {
  const user = c.get('user')
  const userId = user.sub

  try {
    const ideaRepository = new IdeaRepository(c.env.DB)
    const ideas = await ideaRepository.findByUserId(userId)
    return c.json({ ideas })
  } catch (error) {
    console.error('Failed to fetch ideas:', error)
    return c.json({ error: 'アイデアの取得に失敗しました' }, 500)
  }
})

// アイデア詳細取得
app.get('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')  // 型推論が効く！

  try {
    const ideaRepository = new IdeaRepository(c.env.DB)
    const idea = await ideaRepository.findById(id)

    if (!idea || idea.user_id !== user.sub) {
      return c.json({ error: 'アイデアが見つかりません' }, 404)
    }

    return c.json({ idea })
  } catch (error) {
    console.error('Failed to fetch idea:', error)
    return c.json({ error: 'アイデアの取得に失敗しました' }, 500)
  }
})

export default app
```

#### ファイル命名規則

公式の推奨パターンでは、**リソース名の複数形**をファイル名として使用します：

- ✅ `src/routes/ideas.ts` - アイデアの一覧、作成、更新、削除
- ✅ `src/routes/suggestions.ts` - サジェストの一覧、作成
- ✅ `src/routes/users.ts` - ユーザーの一覧、取得

#### 絶対に守るべきルール

1. **❌ 禁止**: `src/controllers/` ディレクトリに Controller クラスを作成すること
2. **❌ 禁止**: static メソッドで処理を切り出して型推論を壊すこと
3. **✅ 必須**: ルートファイル内に直接ハンドラを記述すること
4. **✅ 必須**: 複雑なビジネスロジックは `src/services/` に切り出すこと
5. **✅ 必須**: データアクセスは必ず `src/repositories/` を経由すること

#### 間違った指示への対処

もし「Controller を作って」「IdeasController に追加して」のような指示を受けた場合：

**必ず指摘してください**: 「Hono のベストプラクティスに反するため、Controller は作成しません。代わりに、ルートファイル (`src/routes/ideas.ts` など) に直接ハンドラを記述します。」

#### 複雑なロジックの切り出し

ハンドラが長くなる場合は、ビジネスロジックを Service 層に切り出します：

```typescript
// src/services/ideaSuggestion.ts
export class IdeaSuggestionService {
  constructor(
    private ideaRepository: IdeaRepository,
    private suggestionRepository: SuggestionRepository
  ) {}

  async suggestIdea(userId: string): Promise<Idea | null> {
    // 複雑な提案ロジック
    const ideas = await this.ideaRepository.findByUserId(userId)
    const recentSuggestions = await this.suggestionRepository.findRecent(userId)
    // フィルタリング、優先順位付けなど...
    return selectedIdea
  }
}

// src/routes/suggestions.ts
app.post('/', async (c) => {
  const user = c.get('user')

  const ideaRepository = new IdeaRepository(c.env.DB)
  const suggestionRepository = new SuggestionRepository(c.env.DB)
  const service = new IdeaSuggestionService(ideaRepository, suggestionRepository)

  const suggestion = await service.suggestIdea(user.sub)
  return c.json({ suggestion })
})
```

**参考**: [Hono Best Practices - Controllers](https://hono.dev/docs/guides/best-practices#controllers)

### エンドポイント設計

未検討

## リポジトリパターン

### 概要

**重要**: このプロジェクトでは、すべてのデータベースアクセスをリポジトリ層に集約します。Controller から直接 D1 データベースにアクセスすることは禁止されています。

リポジトリパターンを採用することで、以下のメリットがあります：
- **関心の分離**: データアクセスロジックとビジネスロジックを分離
- **テスタビリティ**: データアクセス層を独立してテスト可能
- **保守性**: データベーススキーマ変更時の影響範囲を最小化
- **再利用性**: 複数の Controller や Service から同じリポジトリを利用可能

### 既存のリポジトリ

#### UserRepository (`src/repositories/UserRepository.ts`)
ユーザー関連のデータアクセスを担当：

**メソッド:**
- `findByEmail(email: string): Promise<User | null>` - メールアドレスでユーザーを検索
- `findByGitHubId(githubId: string): Promise<User | null>` - GitHub ID でユーザーを検索
- `findById(id: string): Promise<User | null>` - ID でユーザーを検索
- `create(userData: CreateUserData): Promise<void>` - 新規ユーザーを作成
- `updatePassword(userId: string, passwordHash: string): Promise<void>` - パスワードを更新

**使用例:**
```typescript
// ルートハンドラ内での使用例
import { UserRepository } from '../repositories/UserRepository';

const userRepository = new UserRepository(c.env.DB);
const user = await userRepository.findByEmail(email);
if (!user) {
  return c.json({ error: 'ユーザーが見つかりません' }, 404);
}
```

#### IdeaRepository (`src/repositories/IdeaRepository.ts`)
アイデア関連のデータアクセスを担当：

**メソッド:**
- `findByUserId(userId: string): Promise<Idea[]>` - ユーザー ID でアイデア一覧を取得
- `findById(id: string): Promise<Idea | null>` - ID でアイデアを取得

**使用例:**
```typescript
// ルートハンドラ内での使用例
import { IdeaRepository } from '../repositories/IdeaRepository';

const ideaRepository = new IdeaRepository(c.env.DB);
const ideas = await ideaRepository.findByUserId(userId);
return c.json({ ideas });
```

### 新しいリポジトリの追加方法

#### 1. リポジトリファイルの作成

新しいエンティティ用のリポジトリを `src/repositories/` 配下に作成します：

```typescript
// src/repositories/SuggestionRepository.ts
import type { D1Database } from "@cloudflare/workers-types";

export interface Suggestion {
  id: string;
  user_id: string;
  idea_id: string;
  suggested_at: string;
  // その他のフィールド
}

export class SuggestionRepository {
  constructor(private db: D1Database) {}

  /**
   * ユーザーIDで提案履歴を取得
   */
  async findByUserId(userId: string): Promise<Suggestion[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM suggestions WHERE user_id = ? ORDER BY suggested_at DESC")
      .bind(userId)
      .all<Suggestion>();
    return results;
  }

  /**
   * 新しい提案を記録
   */
  async create(suggestion: Omit<Suggestion, "id">): Promise<void> {
    const id = crypto.randomUUID();
    await this.db
      .prepare("INSERT INTO suggestions (id, user_id, idea_id, suggested_at) VALUES (?, ?, ?, ?)")
      .bind(id, suggestion.user_id, suggestion.idea_id, suggestion.suggested_at)
      .run();
  }
}
```

**原則:**
- リポジトリクラスは D1Database をコンストラクタで受け取る（依存性注入）
- 各メソッドは単一責任を持つ（1メソッド = 1つのデータアクセス操作）
- 型定義を export して他のファイルから利用可能にする
- SQL クエリはリポジトリ内に閉じ込め、外部に漏らさない

#### 2. テストファイルの作成

すべてのリポジトリには対応するテストファイルを作成します：

```typescript
// tests/repositories/SuggestionRepository.test.ts
import { describe, it, expect, jest } from "@jest/globals";
import { SuggestionRepository } from "../../src/repositories/SuggestionRepository";

describe("SuggestionRepository", () => {
  describe("findByUserId", () => {
    it("should return suggestions for user", async () => {
      const mockResults = [
        {
          id: "suggestion-1",
          user_id: "user-123",
          idea_id: "idea-1",
          suggested_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockAll = (jest.fn() as any).mockResolvedValue({
        results: mockResults,
      });
      const mockBind = (jest.fn() as any).mockReturnValue({ all: mockAll });
      const mockPrepare = (jest.fn() as any).mockReturnValue({ bind: mockBind });

      const mockDB: any = { prepare: mockPrepare };
      const repository = new SuggestionRepository(mockDB);
      const result = await repository.findByUserId("user-123");

      expect(mockPrepare).toHaveBeenCalledWith(
        "SELECT * FROM suggestions WHERE user_id = ? ORDER BY suggested_at DESC"
      );
      expect(result).toEqual(mockResults);
    });
  });
});
```

**テストのポイント:**
- D1Database をモックして、実際の DB 接続なしでテスト
- SQL クエリが正しいパラメータで呼ばれているか確認
- 戻り値の型と内容が期待通りか確認
- エッジケース（null、空配列など）もテスト

#### 3. ルートハンドラからの利用

ルートファイルでは、リポジトリを経由してデータアクセスを行います：

```typescript
// src/routes/suggestions.ts
import { Hono } from "hono";
import type { Bindings, JWTPayload } from "../types/bindings";
import { authMiddleware, type AuthContext } from "../services/middleware";
import { SuggestionRepository } from "../repositories/SuggestionRepository";
import { IdeaRepository } from "../repositories/IdeaRepository";

const app = new Hono<{ Bindings: Bindings } & AuthContext>();

app.use("/*", authMiddleware);

// 提案履歴一覧
app.get("/", async (c) => {
  const user = c.get("user");

  try {
    // リポジトリを使ってデータ取得
    const suggestionRepository = new SuggestionRepository(c.env.DB);
    const suggestions = await suggestionRepository.findByUserId(user.sub);

    return c.json({ suggestions });
  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
    return c.json({ error: "提案履歴の取得に失敗しました" }, 500);
  }
});

export default app;
```

**ルートハンドラの責務:**
- リクエストパラメータの取得とバリデーション
- リポジトリのインスタンス化（`new Repository(c.env.DB)`）
- リポジトリメソッドの呼び出し
- レスポンスの生成
- エラーハンドリング

**禁止事項:**
- ❌ ハンドラから直接 `c.env.DB.prepare()` を呼ぶ
- ❌ SQL クエリをルートファイルに記述する
- ❌ データの変換ロジックをルートファイルに記述する（リポジトリで行う）

### リポジトリ設計のベストプラクティス

1. **単一責任の原則**: 1つのリポジトリは1つのエンティティ（テーブル）を担当
2. **メソッド命名**: `find*`, `create`, `update`, `delete` などの一貫した命名
3. **型安全性**: すべてのメソッドで TypeScript の型を活用
4. **エラーハンドリング**: データベースエラーはリポジトリ内で適切に処理
5. **テストカバレッジ**: すべてのリポジトリメソッドにテストを書く（100% カバレッジを目指す）

## 開発環境

### セットアップ手順
1. Node.js 環境の準備
   ```bash
   nvm use
   npm install
   ```

2. D1 データベースの初期化
   ```bash
   npx wrangler d1 create suggestman
   # database_id を wrangler.toml に反映
   npx wrangler d1 migrations apply suggestman --local
   ```

3. 開発サーバーの起動
   ```bash
   npm run dev
   # http://127.0.0.1:8787 でアクセス可能
   ```

### スクリプト
- `npm run dev`: ローカル開発サーバー起動
- `npm run deploy`: 本番環境へデプロイ
- `npm run lint`: Biome による Lint チェック
- `npm run format`: Biome による自動フォーマット
- `npm run typecheck`: TypeScript 型チェック
- `npm test`: Jest によるテスト実行
- `npm run test:watch`: Jest のウォッチモード
- `npm run test:coverage`: カバレッジレポート生成

## テスト

### テストフレームワーク
- **テストランナー**: Jest v30 + ts-jest
- **テスト環境**: Node.js (ESM モード)
- **テスト配置**: `tests/` ディレクトリ（プロジェクトルート直下）

### ディレクトリ構造
```
tests/
├── repositories/      # リポジトリ層のテスト
└── services/          # サービス層のテスト
```

**重要**: Node.js/TypeScript プロジェクトのデファクトスタンダードに従い、テストは `src/__tests__/` ではなく、プロジェクトルートの `tests/` ディレクトリに配置します。

### テストファイルの命名規則
- テストファイル名: `<対象ファイル名>.test.ts`
- 例: `auth.ts` のテストは `auth.test.ts`

### テストの作成方法

#### 基本構造
```typescript
import { describe, it, expect, jest } from "@jest/globals";
import type { Context } from "hono";
import type { Bindings } from "../../src/types/bindings";
import { AuthController } from "../../src/controllers/auth";

describe("AuthController", () => {
  describe("logout", () => {
    it("should set cookie with Max-Age=0 and redirect to /", async () => {
      const mockContext = {
        header: jest.fn(),
        redirect: jest.fn((url: string) => ({
          status: 302,
          headers: new Headers({ Location: url }),
        })),
      } as unknown as Context<{ Bindings: Bindings }>;

      await AuthController.logout(mockContext);

      expect(mockContext.header).toHaveBeenCalledWith(
        "Set-Cookie",
        "token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
      );
      expect(mockContext.redirect).toHaveBeenCalledWith("/");
    });
  });
});
```

#### インポートパスの注意点
`tests/` ディレクトリから `src/` のファイルを参照する場合:
```typescript
// ❌ 誤り
import { AuthController } from "../../controllers/auth";

// ✅ 正しい
import { AuthController } from "../../src/controllers/auth";
```

### テスト実行
```bash
# すべてのテストを実行
npm test

# 特定のテストファイルのみ実行
npm test tests/controllers/auth.test.ts

# ウォッチモードで実行
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

### モック戦略
- **Hono Context**: `jest.fn()` を使用して必要なメソッドのみモック
- **D1 Database**: テスト用のモックを作成（統合テストでは in-memory SQLite を検討）
- **外部 API**: `jest.mock()` を使用してモジュール全体をモック

### 既知の問題
- **ESM 依存関係の問題**: 一部のコントローラー（例: HomeController）は `jwt.ts` などの ESM モジュールをインポートしており、Jest の ESM サポートの制限により現在テストが失敗します。
- **回避策**:
  - 外部依存が少ないシンプルなコントローラー（例: AuthController）を優先的にテスト
  - 今後、Jest の ESM サポートが改善された際に修正予定

### テストのベストプラクティス
- **デグレード防止**: 機能追加や修正を行う際は、必ずテストを書く
- **テストカバレッジ**: 重要なビジネスロジックは 80% 以上のカバレッジを目指す
- **テスト駆動開発**: 可能な限り、実装前にテストを書く（TDD）
- **テストの独立性**: 各テストは独立して実行可能であること
- **モックの最小化**: 必要最小限のモックに留め、実際の動作に近い状態でテスト

## コーディング規約

### スタイルガイド
- **Linter/Formatter**: Biome を使用
- 型定義は厳密に（`strict: true`）
- **オブジェクト型定義のスペース**: `{}` の内側にはスペースを入れる（例: `{ Bindings: Bindings }` ではなく `{Bindings: Bindings}` は NG）
- **個人情報の禁止**: コード、コメント、seed データに個人情報（メールアドレス、電話番号、住所など）を含めない。もしくは架空の情報や個人に紐づかないものとする（メールアドレスや電話番号は利用されているものは許容しない、住所も公共物に限定する）

#### Git コミット前の自動チェック（Husky）

このプロジェクトでは、[Husky](https://typicode.github.io/husky/) を使用して Git コミット前に自動的にコードフォーマットとリントチェックを実行します。

**動作:**
- `git commit` 実行時に自動的に以下が実行されます:
  1. `npm run format` - Biome によるコードの自動フォーマット
  2. `npm run lint` - Biome によるリントチェック
- リントエラーがある場合はコミットが中止されます

**初回セットアップ:**
```bash
npm install
npx husky init
chmod +x .husky/pre-commit
```

**手動でスキップする場合（非推奨）:**
```bash
git commit --no-verify -m "your message"
```

**注意:** 通常は自動チェックに従い、エラーを修正してからコミットしてください。これにより、コードの品質と一貫性が保たれます。

### ファイル構成の原則
- **index.ts はコンパクトに**: エントリポイントとして `app.route()` でのルートマウントのみを行う
- **API ルートは機能ごとに分離**: `src/routes/` 配下に各リソース単位で Hono インスタンスを作成
- **ルートファイルに直接ハンドラを記述**: Controller クラスは作らず、ルートファイル内でリクエスト処理を実装
- **HTML/CSS は別ファイルに**: 画面ごとに `src/views/` 配下に HTML ファイルを作成
- **JavaScript は外部ファイルに分離**: `src/routes/static.ts` で配信（詳細は後述）
- **ビジネスロジックはサービス層に集約**: `src/services/` 配下に実装（ハンドラが長くなる場合）
- **データアクセスロジックは独立したレイヤーとして管理**: リポジトリパターン必須
- **型定義は共通化**: `src/types/` 配下で一元管理

#### Hono のルーティングパターン

**重要**: このプロジェクトでは Hono の推奨パターンに従い、**Controller クラスを使用しません**。

##### ルートファイル（正しいパターン）
各ルートファイルで `new Hono()` インスタンスを作成し、ハンドラを直接記述:

```typescript
// src/routes/ideas.ts
import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'
import { authMiddleware, type AuthContext } from '../services/middleware'
import { IdeaRepository } from '../repositories/IdeaRepository'

const app = new Hono<{ Bindings: Bindings } & AuthContext>()

// ミドルウェア適用
app.use('/*', authMiddleware)

// アイデア一覧取得（ハンドラを直接記述）
app.get('/', async (c) => {
  const user = c.get('user')
  const userId = user.sub

  try {
    const ideaRepository = new IdeaRepository(c.env.DB)
    const ideas = await ideaRepository.findByUserId(userId)
    return c.json({ ideas })
  } catch (error) {
    console.error('Failed to fetch ideas:', error)
    return c.json({ error: 'アイデアの取得に失敗しました' }, 500)
  }
})

// アイデア作成
app.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  // バリデーション、リポジトリ呼び出しなど...
  return c.json({ success: true }, 201)
})

// アイデア詳細取得（パスパラメータの型推論が効く）
app.get('/:id', async (c) => {
  const id = c.req.param('id')  // 型が自動推論される
  // 処理...
})

export default app
```

##### メインファイル
`app.route()` でルートをマウント:

```typescript
// src/index.ts
import { Hono } from 'hono'
import ideas from './routes/ideas'
import suggestions from './routes/suggestions'

const app = new Hono<{ Bindings: Bindings }>()

app.route('/ideas', ideas)
app.route('/suggestions', suggestions)

export default app
```

#### JavaScript の外部ファイル分離パターン

**重要**: Hono JSX では、`<script>` タグ内に JavaScript を直接記述することができません。

##### なぜ外部ファイルが必要か

Hono JSX の `<script>` タグ内では、以下の制約があります:

1. **JSX パーサーの制約**: `{}` が JSX 式として解釈されるため、JavaScript のオブジェクトや関数が正しく解釈されない
2. **エスケープ問題**: `</script>` タグがテンプレート内に現れると、パーサーが混乱する
3. **セキュリティ**: インライン JavaScript は CSP (Content Security Policy) に違反する可能性がある

##### 実装パターン

**ステップ 1**: `src/routes/static.ts` に JavaScript ファイルを提供するエンドポイントを追加

```typescript
// src/routes/static.ts
import {Hono} from "hono";

const app = new Hono();

// 新しい JavaScript ファイルを追加する場合
app.get("/your-page.js", (c) => {
  const js = `
    function yourFunction() {
      // JavaScript コードをここに記述
      console.log('Hello from external JS');
    }

    // イベントハンドラなど
    async function handleSubmit(e) {
      e.preventDefault();
      // 処理...
    }
  `;

  return c.text(js, 200, {
    "Content-Type": "application/javascript",
    "Cache-Control": "public, max-age=3600",
  });
});

export default app;
```

**ステップ 2**: HTML ビュー (`src/views/`) でスクリプトを参照

```tsx
// src/views/your-page.tsx
import type {FC} from "hono/jsx";

export const YourPage: FC = () => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <title>Your Page</title>
        {/* 外部 JavaScript ファイルを参照 */}
        <script src="/static/your-page.js"></script>
      </head>
      <body>
        {/* HTML 内でイベントハンドラを参照 */}
        <button onclick="yourFunction()" type="button">
          Click me
        </button>
        <form onsubmit="handleSubmit(event)">
          <input type="text" required />
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  );
};
```

**ステップ 3**: メインファイルで static ルートがマウントされているか確認

```typescript
// src/index.ts
import static_routes from "./routes/static";

app.route("/static", static_routes);
```

##### 利点

- **セキュリティ**: CSP 準拠、XSS 攻撃のリスク軽減
- **パフォーマンス**: ブラウザキャッシュが効く（Cache-Control ヘッダー）
- **保守性**: JavaScript と HTML が分離され、デバッグしやすい
- **型安全性**: TypeScript のチェックが効く

##### 実装例

現在のプロジェクトでは以下のファイルがこのパターンを使用しています:

- `src/routes/static.ts`: `/static/login.js` と `/static/dashboard.js` を提供
- `src/views/login.tsx`: ログイン/サインアップフォームのハンドラ
- `src/views/dashboard.tsx`: パスワード設定フォームのハンドラ

#### ディレクトリ構造
```
src/
├── index.ts          # エントリポイント（app.route() のみ）
├── routes/           # ルーティング定義とハンドラ実装
├── repositories/     # データアクセス層（DBアクセスはここに集約）
├── views/            # HTML ファイル (Hono JSX)
├── services/         # ビジネスロジックとユーティリティ
└── types/            # 型定義
```

### 命名規則
- コンポーネント: PascalCase
- 関数・変数: camelCase
- 定数: UPPER_SNAKE_CASE
- ファイル名: kebab-case または camelCase

## 開発タスク例

### 新しいエンドポイントの追加
1. データベーススキーマが必要な場合はマイグレーションを作成
2. リポジトリを作成/更新 (`src/repositories/` 配下)
3. リポジトリのテストを作成 (`tests/repositories/` 配下)
4. Controller を作成/更新 (`src/controllers/` 配下)
5. ルート定義を追加 (`src/routes/` 配下)
6. 必要に応じてサービスロジックを実装 (`src/services/` 配下)
7. 型定義を更新 (`src/types/` 配下)
8. Controller のテストを作成/更新 (`tests/controllers/` 配下)
9. ローカルで動作確認 (`npm run dev`)
10. すべてのテストが通ることを確認 (`npm test`)
11. 型チェックと Lint を実行 (`npm run typecheck && npm run lint`)

### リポジトリへの機能追加
新しいデータアクセス操作が必要になった場合：

1. **リポジトリメソッドを追加**
   ```typescript
   // src/repositories/IdeaRepository.ts
   async findByTag(userId: string, tag: string): Promise<Idea[]> {
     const { results } = await this.db
       .prepare("SELECT * FROM ideas WHERE user_id = ? AND tags LIKE ?")
       .bind(userId, `%${tag}%`)
       .all<IdeaRow>();

     return results.map(idea => ({
       ...idea,
       tags: idea.tags ? JSON.parse(idea.tags) : [],
     }));
   }
   ```

2. **テストを追加**
   ```typescript
   // tests/repositories/IdeaRepository.test.ts
   describe("findByTag", () => {
     it("should return ideas with specified tag", async () => {
       // テストコードを記述
     });
   });
   ```

3. **ルートハンドラから利用**
   ```typescript
   // src/routes/ideas.ts
   const ideaRepository = new IdeaRepository(c.env.DB);
   const ideas = await ideaRepository.findByTag(userId, tag);
   ```

4. **テストを実行して確認**
   ```bash
   npm test tests/repositories/IdeaRepository.test.ts
   ```

### データベーススキーマの変更

#### マイグレーションファイルの命名規則
- **テーブル作成**: `NNNN_create_<table_name>_table.sql`
  - 例: `0001_create_users_table.sql`, `0002_create_ideas_table.sql`
- **カラム追加**: `NNNN_add_<column_name>_to_<table_name>_table.sql`
  - 例: `0003_add_avatar_url_to_users_table.sql`
- **その他の変更**: 変更内容が明確にわかる名前を付ける
  - 例: `0004_add_index_to_ideas_title.sql`

#### マイグレーションファイルの原則
- **1ファイル1テーブル**: 一つのマイグレーションファイルで複数のテーブルを操作しない
  - ただし、関連テーブル（例: users と sessions）は同一ファイルに含めてもよい
- **わかりやすい命名**: `init` のような抽象的な名前は避け、何をするかがファイル名から明確にわかるようにする

#### 変更手順
1. マイグレーションファイルを作成 (`migrations/` 配下)
2. ローカルで適用: `npx wrangler d1 migrations apply suggestman --local`
3. 動作確認
4. 本番適用: `npx wrangler d1 migrations apply suggestman`

### デバッグ
- `console.log` は Wrangler のコンソールに出力される
- D1 のクエリ確認: `npx wrangler d1 execute suggestman --local --command "SELECT ..."`

## MVP の重要ポイント

### 現在の開発フォーカス
- `POST /api/suggestions` の実装が最優先
- 提案アルゴリズムの MVP 版（クールダウン機能を含む）
- ストレージアクセスレイヤの整備

### 実装時の注意点
1. **提案の質**: タグ、気分、履歴を考慮したフィルタリング
2. **クールダウン**: 同じアイデアを短期間で重複提示しない
3. **後押しメッセージ**: モチベーションを高める文言を含める

## トラブルシューティング

### よくある問題

**D1 に接続できない**
- `wrangler.toml` の `database_id` が正しいか確認
- マイグレーションが適用されているか確認

**型エラーが出る**
- `npm run typecheck` で詳細を確認
- `@cloudflare/workers-types` が最新か確認

**デプロイに失敗する**
- Cloudflare アカウントの認証状態を確認
- `wrangler login` で再認証

## チーム体制

詳細は `AGENTS.md` を参照してください。仮想エージェントチームとして以下の役割があります：

- **プロダクトキュレーター**: ユースケース整理、優先順位付け
- **UX クラフター**: 画面フロー、インタラクション設計
- **システムアーキテクト**: ドメインモデル、API 設計
- **エクスペリエンスエンジニア**: Hono + Workers 実装
- **インサイトアナリスト**: ログ解析、改善提案
- **QA スチュワード**: テストシナリオ設計

## 参考リソース

- [Hono ドキュメント](https://hono.dev/)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Biome ドキュメント](https://biomejs.dev/)

## 開発の進め方

1. **タスクの理解**: README.md と AGENTS.md でコンテキストを把握
2. **設計の確認**: 既存のアーキテクチャに沿った実装を心がける
3. **実装**: コードを記述
4. **品質チェック（必須）**: 修正完了前に必ず以下を実行
   ```bash
   npm run format  # コードフォーマット
   npm run lint    # Lint チェック
   npm test        # テスト実行
   ```
   **重要**: Claude による修正が完了する前に、必ずこれらのチェックを実行してください。すべてのチェックが成功することを確認してから、ユーザーに報告してください。
5. **デプロイ**: 段階的にリリース
