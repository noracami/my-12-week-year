# My 12-Week Year

個人 12 週年目標追蹤系統的 MVP。

## 專案架構

```
my-12-week-year/
├── frontend/          # React 前端應用
├── backend/           # Hono API (Cloudflare Workers)
├── biome.json         # Linter/Formatter 設定
├── pnpm-workspace.yaml
└── prd.md             # 產品需求文件
```

使用 **pnpm workspaces** 管理 monorepo。

## 技術棧

### Frontend (`frontend/`)

| 技術 | 版本 | 備註 |
|------|------|------|
| React | 19 | 使用 React Compiler |
| Vite | 7 | 建構工具 |
| Tailwind CSS | v4 | CSS 變數驅動 |
| Base UI | 1.0.0-rc.0 | 無樣式互動元件 |
| TypeScript | 5.9 | |

**注意**：本專案**不使用 shadcn/ui**，僅使用 Base UI 搭配 Tailwind CSS 自行建構元件。

### Backend (`backend/`)

| 技術 | 用途 |
|------|------|
| Hono | Edge API 框架 |
| Cloudflare D1 | SQLite 資料庫 |
| Drizzle ORM | 型別安全的 ORM |
| Better Auth | Discord OAuth 身份驗證 |
| Wrangler | Cloudflare 開發/部署工具 |

## 資料庫 Schema

使用 Drizzle ORM 定義於 `backend/src/db/schema.ts`：

### Better Auth 表格（自動管理）

- `users` - 使用者資訊
- `sessions` - 登入 session
- `accounts` - OAuth 帳戶連結
- `verifications` - 驗證 token

### 應用表格

**tactics（戰術）**
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | TEXT | Primary Key |
| user_id | TEXT | FK → users.id |
| name | TEXT | 戰術名稱 |
| type | TEXT | `daily_check` / `daily_number` / `weekly_count` / `weekly_number` |
| target_value | REAL | 目標值 |
| unit | TEXT | 單位（如 kg、次） |
| active | INTEGER | 是否啟用 |

**records（記錄）**
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | TEXT | Primary Key |
| tactic_id | TEXT | FK → tactics.id |
| date | TEXT | 日期（YYYY-MM-DD） |
| value | REAL | 數值（勾選為 1/0） |

## API 端點

### 身份驗證

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/auth/*` | * | Better Auth 處理 |
| `/api/me` | GET | 取得當前使用者 |

### 戰術 CRUD

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/tactics` | GET | 取得所有戰術 |
| `/api/tactics` | POST | 新增戰術 |
| `/api/tactics/:id` | PUT | 更新戰術 |
| `/api/tactics/:id` | DELETE | 刪除戰術 |

### 記錄 CRUD

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/records` | GET | 取得記錄（支援 startDate, endDate, tacticId） |
| `/api/records` | POST | 新增/更新記錄（Upsert） |
| `/api/records/:id` | DELETE | 刪除記錄 |
| `/api/records/score` | GET | 計算週執行率 |

## 開發指令

```bash
# 安裝依賴
pnpm install

# 前端開發
pnpm dev:frontend

# 後端開發
pnpm dev:backend

# 執行所有測試
pnpm test

# 類型檢查
pnpm typecheck

# Lint 檢查
pnpm lint

# 建置所有專案
pnpm build
```

## 程式碼風格 (Biome)

- **縮排**：Tab
- **引號**：雙引號 `"`
- **Linter**：啟用 recommended rules
- **Import 排序**：自動整理

執行格式化：
```bash
pnpm biome format --write .
pnpm biome check --write .
```

## 設計原則

1. **Mobile-first**：介面優先針對手機瀏覽器優化
2. **極速輸入**：減少操作步驟，快速完成每日記錄
3. **單一使用者**：僅供個人使用，身份驗證確保資料安全

## 核心功能（MVP）

- 每日檢核（二元勾選 + 數值輸入）
- 非每日任務次數統計
- 即時計算週得分（執行率 = 實際完成 / 計畫應完成 × 100）
- Firebase 推播提醒（低優先）

## 未來功能規劃

MVP 後將擴充以下功能：

| 功能 | 說明 |
|------|------|
| **季度 (Quarter)** | 12 週為一季，季度目標設定與回顧 |
| **團隊 (Team)** | 建立團隊，查看成員執行率 |
| **分組 (Group)** | 團隊內分組管理 |

預期架構：
```
季度 (Quarter)
  └── 團隊 (Team)
        └── 成員 (Member)
              └── 戰術 (Tactics)
                    └── 每日/週記錄 (Records)
```

> MVP 階段先不預留欄位，之後透過 migration 擴充。

## CI/CD

使用 GitHub Actions 自動化流程（`.github/workflows/ci.yml`）：

### 每次 Push/PR 自動執行

1. `pnpm lint` - Biome 檢查
2. `pnpm typecheck` - TypeScript 類型檢查
3. `pnpm test` - Vitest 測試
4. `pnpm build` - 建置驗證

### 部署（僅 main branch）

- **Frontend** → Cloudflare Pages
- **Backend** → Cloudflare Workers

### 必要的 GitHub Secrets

| Name | 說明 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 帳戶 ID |

### 必要的 Cloudflare Workers Secrets

在 `backend/` 目錄執行 `pnpm wrangler secret put <NAME>` 設定：

| Name | 說明 |
|------|------|
| `DISCORD_CLIENT_ID` | Discord OAuth Client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth Client Secret |
| `BETTER_AUTH_SECRET` | Better Auth 加密金鑰（至少 32 字元） |
| `BETTER_AUTH_URL` | 後端 URL（如 `https://backend.xxx.workers.dev`） |
| `FRONTEND_URL` | 前端 URL（如 `https://my-12-week-year.pages.dev`） |

### 部署設定步驟

#### 1. 取得 Cloudflare Account ID

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 點擊任一網域（或 Workers & Pages）
3. 右側欄找到 **Account ID**，複製保存

#### 2. 建立 Cloudflare API Token

1. Cloudflare Dashboard → 右上角頭像 → **My Profile**
2. 左側選單 → **API Tokens**
3. 點擊 **Create Token**
4. 選擇 **Edit Cloudflare Workers** 模板，或自訂權限：
   - `Account - Cloudflare Pages:Edit`
   - `Account - Cloudflare Workers Scripts:Edit`
   - `Account - Account Settings:Read`
5. 建立後複製 Token（只會顯示一次）

#### 3. 建立 Cloudflare Pages 專案

1. Cloudflare Dashboard → **Workers & Pages**
2. **Create** → **Pages** → **Direct Upload**（或連結 Git）
3. 專案名稱填：`my-12-week-year`

#### 4. 設定 GitHub Repository Secrets

1. GitHub repo → **Settings**
2. 左側 **Secrets and variables** → **Actions**
3. **Repository secrets** → **New repository secret**
4. 新增以下兩個：

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | 步驟 2 取得的 Token |
| `CLOUDFLARE_ACCOUNT_ID` | 步驟 1 取得的 Account ID |

#### 5. 驗證部署

Push 到 main branch 後，GitHub Actions 會自動：
1. 執行 CI 檢查（lint、typecheck、test、build）
2. 部署 Frontend 到 Cloudflare Pages
3. 部署 Backend 到 Cloudflare Workers

部署完成後可在以下位置查看：
- Frontend: `https://my-12-week-year.pages.dev`
- Backend: `https://backend.<your-subdomain>.workers.dev`

## 測試

使用 **Vitest** 作為測試框架。

```bash
# 執行所有測試
pnpm test

# 監視模式（開發時）
pnpm --filter frontend test:watch
pnpm --filter backend test:watch
```

## 目前實作進度

### 已完成

- [x] 專案初始化（pnpm monorepo）
- [x] CI/CD 流程（GitHub Actions）
- [x] Cloudflare D1 資料庫設定
- [x] Drizzle ORM Schema 定義
- [x] Better Auth + Discord OAuth
- [x] 後端 API（Tactics、Records CRUD）
- [x] 前端登入/登出流程
- [x] 前端路由（Layout + 底部導覽）
- [x] 前端 API 層（TanStack Query）
- [x] 前端戰術管理介面
- [x] 前端每日記錄介面
- [x] 週執行率計算與顯示

### 待實作

- [ ] Firebase 推播提醒（低優先）
