# GitHub OAuth アプリケーション設定ガイド

このガイドでは、Suggestman で GitHub OAuth 認証を使用するための設定手順を説明します。

## 1. GitHub OAuth App の作成

### 手順

1. GitHub にログインし、[GitHub Developer Settings](https://github.com/settings/developers) にアクセス

2. 左側のメニューから「OAuth Apps」を選択

3. 「New OAuth App」ボタンをクリック

4. 以下の情報を入力：

   **Application name**
   ```
   Suggestman (Development)
   ```

   **Homepage URL** (ローカル開発用)
   ```
   http://127.0.0.1:8787
   ```

   **Application description** (オプション)
   ```
   Suggestman - Your Personal Activity Suggestion App
   ```

   **Authorization callback URL** (重要)
   ```
   http://127.0.0.1:8787/api/auth/github/callback
   ```

5. 「Register application」をクリック

## 2. Client ID と Client Secret の取得

OAuth App を作成すると、以下の情報が表示されます：

- **Client ID**: `Ov23liXXXXXXXXXXXXXX` のような形式
- **Client Secret**: 「Generate a new client secret」ボタンをクリックして生成

**重要**: Client Secret は一度しか表示されないため、必ず安全な場所に保存してください。

## 3. 環境変数の設定

### ローカル開発環境

プロジェクトルートに `.dev.vars` ファイルを作成し、以下の内容を記載：

```
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
JWT_SECRET=your_random_jwt_secret_here
```

**JWT_SECRET の生成方法**:
```bash
# macOS / Linux
openssl rand -base64 32

# または Node.js で生成
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 本番環境

Cloudflare Workers の Secrets を使用：

```bash
npx wrangler secret put GITHUB_CLIENT_ID
# プロンプトでClient IDを入力

npx wrangler secret put GITHUB_CLIENT_SECRET
# プロンプトでClient Secretを入力

npx wrangler secret put JWT_SECRET
# プロンプトでJWT Secretを入力
```

## 4. 本番環境用の GitHub OAuth App

本番環境では、別の OAuth App を作成することを推奨します：

**Application name**
```
Suggestman (Production)
```

**Homepage URL**
```
https://suggestman.your-domain.com
```

**Authorization callback URL**
```
https://suggestman.your-domain.com/api/auth/github/callback
```

## 5. OAuth フローの確認

設定が完了したら、以下の URL にアクセスして OAuth フローをテスト：

```
http://127.0.0.1:8787/api/auth/github
```

正常に動作する場合：
1. GitHub の認証画面にリダイレクトされる
2. 認証後、callback URL に戻る
3. JWT トークンが発行される

## トラブルシューティング

### エラー: "redirect_uri_mismatch"

**原因**: Callback URL が OAuth App の設定と一致していない

**解決方法**:
1. GitHub の OAuth App 設定で Callback URL を確認
2. 正確に `http://127.0.0.1:8787/api/auth/github/callback` になっているか確認
3. `localhost` ではなく `127.0.0.1` を使用

### エラー: "Bad credentials"

**原因**: Client ID または Client Secret が不正

**解決方法**:
1. `.dev.vars` ファイルの値が正しいか確認
2. Client Secret を再生成して更新

### エラー: 環境変数が読み込まれない

**原因**: `.dev.vars` ファイルが正しく配置されていない

**解決方法**:
1. `.dev.vars` がプロジェクトルートにあるか確認
2. Wrangler を再起動: `npm run dev`

## セキュリティ上の注意

- ❌ `.dev.vars` ファイルを Git にコミットしない（`.gitignore` に追加済み）
- ❌ Client Secret を公開リポジトリに含めない
- ✅ 本番環境では Cloudflare Workers Secrets を使用
- ✅ JWT Secret は十分にランダムな文字列を使用（最低32バイト）

## 参考リンク

- [GitHub OAuth Apps ドキュメント](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
