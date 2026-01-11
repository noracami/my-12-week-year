# Bug Fix: Safari OAuth 登入失敗

---

## Situation（情境）

> reported by @liwenchiou

iPhone Safari 使用者在 Discord OAuth 登入後，停留在 backend worker URL 無法正常進入應用程式。Chrome 使用者則正常運作。

透過 Safari 開發者工具追蹤，發現 OAuth callback 返回 `state_mismatch` 錯誤。

## Task（任務）

診斷並修復 Safari 瀏覽器無法完成 OAuth 登入流程的問題。

## Action（行動）

1. **根因分析**：Safari ITP（Intelligent Tracking Prevention）在跨域重定向時阻擋 `SameSite=None` 的 Cookie，導致 OAuth state cookie 在 callback 時遺失。

2. **解決方案設計**：使用 Cloudflare Pages Functions 將 API 請求代理到同域名下，避免跨域 Cookie 問題。

3. **實作變更**：
   - 新增 `frontend/functions/api/[[path]].ts` 作為 API 代理
   - 設定 `redirect: "manual"` 防止 fetch 自動跟隨重定向
   - 前端改用相對路徑（production 時為空字串）
   - 後端 Cookie `sameSite` 從 `"none"` 改為 `"lax"`
   - 更新 Discord OAuth redirect URI 與 Cloudflare Workers secrets

## Result（結果）

- Safari 與 Chrome 使用者皆可正常完成 OAuth 登入
- 同域名架構也簡化了 CORS 設定
- 免費額度充足（100,000 requests/天），適合 MVP 階段使用
