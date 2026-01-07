# 🎯 產品核心需求 (Product Requirements)

這個 MVP 的目標是讓你能在 1/11（週日）前開始記錄，核心功能包含：

## 戰術計分看板

- **每日檢核**：二元勾選（如：01:00 前躺平）與數值輸入（如：體重）。
- **非每日任務**：次數統計（如：每週 3 次 Side Project）。
- **即時計分**：依據執行率公式計算當週得分：

$$
Score = \frac{\text{實際完成次數}}{\text{計畫應完成次數}} \times 100
$$

## 身份驗證

確保只有你能存取並記錄你的數據。

## 主動提醒

透過 Firebase 發送通知，確保每天睡前記得填寫。

## 行動優先

介面必須針對手機瀏覽器優化，達到「極速輸入」。

---

# 🛠️ 技術選型總覽 (Tech Stack Summary)

我們選擇了一套 **2026 年最前衛且高效** 的組合，兼顧了開發速度（DX）與執行效能（UX）。

## 1. 前端開發環境 (Frontend Stack)

| 項目       | 選擇            | 說明                                           |
| ---------- | --------------- | ---------------------------------------------- |
| 框架       | React 19        | 利用其編譯器優化與成熟的生態系                 |
| 建構工具   | Vite + pnpm     | 極速開發體驗與套件管理                         |
| 程式碼規範 | Biome           | 整合 Linter 與 Formatter，取代 ESLint/Prettier |
| 樣式       | Tailwind CSS v4 | CSS 變數驅動，更輕量高效                       |

### UI 組件

- **Base UI**：提供無樣式的互動邏輯 (JS)。

## 2. 後端與資料庫 (Backend & Data Layer)

| 項目     | 選擇          | 說明                                           |
| -------- | ------------- | ---------------------------------------------- |
| 後端框架 | Hono          | 運行於 Cloudflare Workers 的極速 Edge API 框架 |
| 資料庫   | Cloudflare D1 | Serverless SQL/SQLite                          |
| ORM      | Drizzle ORM   | 提供極致的 TypeScript 型別安全                 |
| 身份驗證 | Better Auth   | 整合 Google OAuth，Session 存於 D1             |

## 3. 基礎設施與功能 (Infrastructure & Extras)

| 項目     | 選擇                           | 說明                         |
| -------- | ------------------------------ | ---------------------------- |
| 部署平台 | Cloudflare Pages + Workers     | 前端用 Pages，後端用 Workers |
| 通知系統 | Firebase Cloud Messaging (FCM) | 處理 Web Push 通知           |
| 開發維運 | GitHub Actions                 | 實作 CI/CD 自動化部署        |
