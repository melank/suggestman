// GitHub OAuth API Utilities

import type {GitHubTokenResponse, GitHubUser} from "../types/bindings";

// GitHub OAuth: アクセストークンを取得
export async function getGitHubAccessToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("GitHub token error:", response.status, errorText);
    throw new Error(`Failed to get GitHub access token: ${response.status}`);
  }

  const data: GitHubTokenResponse = await response.json();

  if (!data.access_token) {
    console.error("No access token in response:", data);
    throw new Error("No access token in response");
  }

  return data.access_token;
}

// GitHub API: ユーザー情報を取得
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Suggestman",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("GitHub API error:", response.status, errorText);
    throw new Error(
      `Failed to get GitHub user: ${response.status} ${errorText}`
    );
  }

  const user: GitHubUser = await response.json();

  // メールアドレスがprivateの場合は別途取得
  if (!user.email) {
    user.email = await getGitHubPrimaryEmail(accessToken);
  }

  return user;
}

// GitHub API: プライマリメールアドレスを取得
async function getGitHubPrimaryEmail(
  accessToken: string
): Promise<string | null> {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Suggestman",
    },
  });

  if (!response.ok) {
    return null;
  }

  const emails: Array<{
    email: string;
    primary: boolean;
    verified: boolean;
  }> = await response.json();

  // プライマリかつ検証済みのメールアドレスを取得
  const primaryEmail = emails.find((e) => e.primary && e.verified);

  return primaryEmail?.email || null;
}
