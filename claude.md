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
| Better Auth | Google OAuth 身份驗證 |
| Wrangler | Cloudflare 開發/部署工具 |

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

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 測試

使用 **Vitest** 作為測試框架。

```bash
# 執行所有測試
pnpm test

# 監視模式（開發時）
pnpm --filter frontend test:watch
pnpm --filter backend test:watch
```
