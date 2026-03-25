# LIFF 全障運傳聖火打卡（第一階段骨架）

本專案是 `Vue 3 + Vite + TypeScript` 的 LIFF 前端骨架，先完成可運行架構、設定分層與服務層，暫不實作 Figma 視覺畫面。

## 技術棧

- Vue 3
- Vite
- TypeScript
- Tailwind CSS + PostCSS + Autoprefixer
- Axios
- `@line/liff` 2.x

## 開發指令

```bash
npm install
npm run dev
```

```bash
npm run build
```

## 目錄重點

- `index.html`：載入 LIFF SDK，注入 `window.endpoint` runtime 設定
- `src/config/endpoint.ts`：統一讀取與預設 endpoint 設定
- `src/services/liffService.ts`：LIFF 初始化、登入判斷、profile/userId 取得與 fallback
- `src/services/apiClient.ts`：Axios 共用 client（baseURL/token/timeout）
- `src/App.vue`：最小功能殼層，顯示狀態與 userId

## `window.endpoint` 欄位說明

在 `index.html` 直接設定：

- `baseURL`: API base URL
- `uploadImageUrl` / `uploadImagePath`: 打卡影像上傳端點
- `uploadStatusUrl`: 上傳進度查詢端點
- `authToken`: API token（若需要）
- `timeout`: API timeout（毫秒）
- `liffId`: LIFF ID
- `basicId`: LINE 官方帳號 basic id
- `enableLiff`: 是否啟用 LIFF 流程
- `testUserId`: 非 LIFF 或本地 fallback userId
- `debug`: 是否輸出除錯資訊

## 搬移原則（對照舊專案）

1. 保留 `window.endpoint` 作為 runtime 設定注入點
2. 把 LIFF 生命週期集中在 `liffService`
3. 把 API 設定集中在 `apiClient`
4. UI 分頁與流程下一階段再接入


http://localhost:5174/?forceNoTeamPopup=1&after=progress