# Auto-GAO 專案開發文件

## 1. 專案概述
本專案為一個自動化工具，用於介接 `Gun Art Online` (原本為 Sword Art Online) 的網頁遊戲 API。
*   **前端網址**: https://gunartonline.onrender.com/
*   **後端 API 網址**: https://gunart-backend.onrender.com/api

## 2. 技術棧
*   **框架**: Vue 3 (TypeScript)
*   **UI 組件庫**: Element Plus
*   **HTTP 客戶端**: Axios
*   **日期處理**: Moment.js

## 3. 目錄結構盤點
*   `src/api/`: 存放 API 定義 (`user.js`)。
*   `src/common/`: 存放遊戲邏輯檢查器（如戰鬥、鍛造、狀態檢查）。
*   `src/components/`: Vue 功能組件（如自動戰鬥、自動鍛造、裝備選擇）。
*   `src/views/`: 頁面視圖。

## 4. API 端點盤點 (Endpoints)
所有 API 呼叫均使用 `token` 作為 Header。

| 功能 | 路徑 | 方法 | 說明 |
| :--- | :--- | :--- | :--- |
| 個人資料 | `/profile` | GET | 取得角色目前狀態、血量、地圖 |
| 開始休息 | `/action/rest` | POST | 角色進入休息狀態 |
| 完成行動 | `/action/complete` | POST | 完成休息、移動或重生 |
| 完成移動 | `/zone/move/complete` | POST | 完成地圖移動 |
| 狩獵/戰鬥 | `/hunt` | POST | 執行戰鬥（type 1）或逃跑（type 2） |
| 移動地圖 | `/zone/move/{id}` | POST | 切換地圖區域 |
| 進入秘境 | `/path` | POST | 進入特定地圖路徑 |
| 復活 | `/action/revive` | POST | 角色死亡後復活 |
| 裝備 | `/equipment/{id}/equip` | POST | 裝備武器或防具 |
| 卸除裝備 | `/equipment/{id}/unequip` | POST | 卸除單一裝備 |
| 卸除所有 | `/equipment/unequipAll` | POST | 卸除角色身上所有裝備 |
| 道具清單 | `/items` | GET | 取得背包所有道具 |
| 狩獵資訊 | `/hunt/info` | GET | 取得目前狩獵環境的技能與裝備需求 |
| 鍛造 | `/forge` | POST | 開始鍛造裝備 |
| 完成鍛造 | `/forge/complete` | POST | 領取鍛造完成的裝備 |
| 回收 | `/equipment/{id}/recycle` | POST | 回收裝備取得材料 |
| 使用補品 | `/items/{id}/use` | POST | 消耗道具回復 HP/SP |

## 5. API 呼叫頻率限制說明
為了避免被後端伺服器封鎖，專案中實施了以下限制：
*   **狀態檢查**: 根據 `src/common/statusChecker.js`，休息與移動均有計時機制（通常為 5-10 分鐘）。
*   **迴圈延遲**: 在執行自動化任務時，應調用 `src/common/sleep.js` 來確保請求之間有足夠間隔。
*   **建議間隔**: 每次 API 請求之間建議至少間隔 **1.5 至 3 秒**。
