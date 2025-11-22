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
- **Node.js**: v20 (`.nvmrc` で管理)

## アーキテクチャ

### システム構成
```
Client → Cloudflare Workers (Hono) → Suggestion Service → D1 Storage
```

### 主要コンポーネント
- **API 層**: Hono によるリクエストルーティング、バリデーション
- **サービス層**: 提案ロジック、フィルタリング、優先順位付け
- **ストレージ層**: D1 によるアイデア管理、提案履歴

### エンドポイント設計
- `POST /api/suggestions`: コンテキストに基づいた提案を取得
- `POST /api/ideas`: 新しいアイデアを登録
- `GET /api/ideas`: 登録済みアイデア一覧を取得

## 開発環境

### セットアップ手順
1. Node.js 20 環境の準備
   ```bash
   nvm use
   npm install
   ```

2. D1 データベースの初期化
   ```bash
   npx wrangler d1 create suggestman-db
   # database_id を wrangler.toml に反映
   npx wrangler d1 migrations apply suggestman-db --local
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

## コーディング規約

### スタイルガイド
- **Linter/Formatter**: Biome を使用
- コミット前に `npm run format` と `npm run lint` を実行
- 型定義は厳密に（`strict: true`）

### ファイル構成の原則
- **index.ts はコンパクトに**: エントリポイントとして `app.route()` でのルートマウントのみを行う
- **API ルートは機能ごとに分離**: `src/routes/` 配下に各リソース単位で Hono インスタンスを作成
- **HTML/CSS は別ファイルに**: 画面ごとに `src/views/` 配下に HTML ファイルを作成
- **ビジネスロジックはサービス層に集約**: `src/services/` 配下に実装
- **データアクセスロジックは独立したレイヤーとして管理**: リポジトリパターンを推奨
- **型定義は共通化**: `src/types/` 配下で一元管理

#### Hono のルーティングパターン
各ルートファイルで `new Hono()` インスタンスを作成し、`export default` でエクスポート:

```typescript
// src/routes/ideas.ts
import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => c.json('list ideas'))
app.post('/', (c) => c.json('create idea', 201))
app.get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
```

メインファイルで `app.route()` を使ってマウント:

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

#### ディレクトリ構造
```
src/
├── index.ts          # エントリポイント（app.route() のみ）
├── routes/           # 各リソースの Hono インスタンス
│   ├── index.ts      # /, /health
│   ├── ideas.ts      # /ideas/* のルート
│   └── suggestions.ts # /suggestions/* のルート
├── views/            # HTML ファイル
│   ├── login.html
│   └── dashboard.html
├── services/         # ビジネスロジック
│   └── suggestion.ts
├── lib/              # ユーティリティ
│   ├── jwt.ts
│   └── github.ts
└── types/            # 型定義
    ├── bindings.ts
    └── context.ts
```

### 命名規則
- コンポーネント: PascalCase
- 関数・変数: camelCase
- 定数: UPPER_SNAKE_CASE
- ファイル名: kebab-case または camelCase

## 開発タスク例

### 新しいエンドポイントの追加
1. ルート定義を追加 (`src/routes/` 配下)
2. サービスロジックを実装 (`src/services/` 配下)
3. 型定義を更新 (`src/types/` 配下)
4. ローカルで動作確認 (`npm run dev`)
5. 型チェックと Lint を実行

### データベーススキーマの変更
1. マイグレーションファイルを作成 (`migrations/` 配下)
2. ローカルで適用: `npx wrangler d1 migrations apply suggestman-db --local`
3. 動作確認
4. 本番適用: `npx wrangler d1 migrations apply suggestman-db`

### デバッグ
- `console.log` は Wrangler のコンソールに出力される
- D1 のクエリ確認: `npx wrangler d1 execute suggestman-db --local --command "SELECT ..."`

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
3. **テスト**: ローカル環境で十分に動作確認
4. **コードレビュー**: Lint、型チェック、フォーマットを実行
5. **デプロイ**: 段階的にリリース
