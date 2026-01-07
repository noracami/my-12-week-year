# My 12-Week Year

個人 12 週年目標追蹤系統，幫助你每日記錄、計算執行率。

## 功能

- Discord OAuth 登入
- 每日檢核（二元勾選 + 數值輸入）
- 非每日任務次數統計
- 即時計算週執行率

## 技術棧

| 前端 | 後端 |
|------|------|
| React 19 | Hono |
| Vite 7 | Cloudflare Workers |
| Tailwind CSS v4 | Cloudflare D1 |
| Base UI | Drizzle ORM |

## 快速開始

```bash
# 安裝依賴
pnpm install

# 前端開發
pnpm dev:frontend

# 後端開發
pnpm dev:backend

# 執行測試
pnpm test

# 建置
pnpm build
```

## 文件

詳細的技術文件與部署設定請參考 [claude.md](./claude.md)。

## License

MIT
