# Auto-GAO (Gun Art Online 自動化掛機助手)

本專案為一個基於 Vue 3 (TypeScript) 與 Element Plus 開發的個人自動化輔助工具，旨在串接 `Gun Art Online` 遊戲 API，提供自動戰鬥（組隊巡檢哨兵模式）、自動鍛造、自動採礦、裝備自動回收等自動化背景託管掛機功能。

---

## 🚀 專案指令說明

### 1. 安裝與環境設定
在第一次執行專案前，必須下載並安裝相依套件：
```bash
npm install
```

### 2. 開發偵錯模式（熱重載）
啟動本地開發伺服器，代碼變更後瀏覽器會即時更新。
```bash
npm run serve
```

### 3. 生產環境編譯與打包（Build）
將專案編譯並壓縮成最輕量化的靜態網頁檔案，打包結果會輸出於專案根目錄下的 `dist/` 資料夾中。
```bash
npm run build
```

### 4. 程式碼風格檢查與修復（Lint）
執行 ESLint 與 Prettier 自動排版與代碼風格修復。
```bash
npm run lint
```

---

## 💡 一鍵自動化批次檔（Windows 專屬）

為了省去每次開啟終端機手動輸入指令的繁瑣過程，您可以在專案根目錄下建立以下兩個批次檔（`.bat`）：

### 🛠️ 1. 一鍵打包專案 (`一鍵打包.bat`)
建立檔案 `build.bat` 並寫入以下內容，雙擊即可自動打包產生 `dist/`：
```bat
@echo off
echo 正在編譯打包專案，請稍候...
call npm run build
echo 打包完成！已產生 dist 資料夾。
pause
```

### ⚡ 2. 一鍵啟動打包網頁 (`一鍵啟動.bat`)
打包後的 `dist/` 為純靜態網頁，無法直接雙擊 `index.html` 執行。建立檔案 `start.bat` 並寫入以下內容，雙擊即可 **0 秒快速載入** 開啟掛機：
```bat
@echo off
echo 正在啟動打包後的靜態網頁...
echo 請在瀏覽器打開 http://localhost:8080
call npx serve -s dist -l 8080
```

### 📥 3. 一鍵啟動至右下角系統匣常駐（不佔用工作列 `start_tray.bat`）
若不希望在下方工作列留下一整個 Cmd 黑色視窗，希望將掛機服務常駐於右下角系統匣（系統匣常駐，並支援滑鼠右鍵選單控制與關閉），可以使用此方法：

1. 確保專案目錄下有 `start_tray.ps1` 檔案。
2. 確保專案目錄下有 `start_tray.bat` 檔案。
3. 雙擊執行 `start_tray.bat`，即可完全隱藏命令提示字元視窗。
4. **控制與關閉**：右下角系統列會出現一個應用程式圖示，對該圖示**點擊兩下**或**按滑鼠右鍵選擇「開啟網頁」**即可在瀏覽器打開掛機網頁；選單中選擇**「結束並關閉」**即會自動停用背景的掛機服務並徹底清除伺服器行程。

> 💡 **優點**：讓掛機服務完美隱形在背景，只有右下角出現控制圖示，工作列保持完全乾淨！

---

## ⚠️ 常見問題與設定修復

### 換行符 (CRLF) 造成的 Prettier 報錯修復
如果您在執行或編譯時遇到 `error Delete ␍ prettier/prettier` 報錯，請在專案根目錄執行以下 Git 設定指令，阻止 Git 自動強制將換行符轉換為 CRLF：
```bash
git config --global core.autocrlf false
```
並確保 `.prettierrc` 或 `prettier.config.js` 設定中包含 `"endOfLine": "auto"`。
