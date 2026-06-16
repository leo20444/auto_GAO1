# GAO 系統流程對齊與 API 審計報告 (SYSTEM_FLOW_ALIGNMENT_REPORT.md)

本報告彙整了此次 GAO 網頁端爬蟲日誌盤點的結果、程式流程落差分析、以及預計採取的對齊與修復方案。此份紀錄用以確保未來自動化腳本的 API 呼叫流程與真實遊戲前端完全一致。

---

## 1. 核心系統流程盤點與 API 規格

經盤點 `docs/api_intercepted/` 中由爬蟲與手動操作所截獲的封包，核心流程的 API 對接端點與規格如下：

### 1.1 城鎮採礦 (Town Mining) 流程
* **開始採礦**：
  * **Request**：`POST /api/town/mine/start`
  * **Body**：`{ "zone": "forest" | "iron_mine" | "grandma" }`
* **狀態查詢**：
  * **Request**：`GET /api/town/mine/status`
  * **Response**：
    ```json
    {
      "active": true,
      "zone": "forest",
      "startedAt": "2026-06-16T07:28:58.934Z",
      "elapsedSeconds": 340,
      "canCollect": false,
      "requiredSeconds": 900
    }
    ```
* **收割物資**：
  * **Request**：`POST /api/town/mine/collect` (無 Body)

### 1.2 戰鬥與趕路 (Battle & Run) 流程
在爬塔戰鬥或趕路中，每次操作必須按順序發送 **3 個 API 請求**：
1. **發起動作**：
   * **Request**：`POST /api/tower/choose`
   * **Body**：`{ "option": "fight" | "run" }`
2. **獲取過程**：
   * **Request**：`GET /api/tower/timeline`
3. **結算與前進 (關鍵遺漏)**：
   * **Request**：`POST /api/tower/advance`
   * **Body**：`{ "option": "fight" | "run" }`

### 1.3 裝備與武器回收 (Weapon Recycle) 流程
* **單件/批量回收**：
  * **Request**：`POST /api/forge/recycle/{crafted_eq_id}` (無 Body)

### 1.4 鍛造狀態偵測 (Forge Jobs) 流程
* **工作查詢**：
  * **Request**：`GET /api/forge/jobs`
  * **完成鍛造**：
    * **Request**：`POST /api/forge/complete`

---

## 2. 程式流程落差與優化新增功能

| 業務流程 | 網頁真實行為 (爬蟲) | 原腳本行為 | 改善與修復方案 |
| :--- | :--- | :--- | :--- |
| **戰鬥/趕路** | 呼叫 `choose` ➡️ `timeline` ➡️ **`advance`** | 僅呼叫 `choose` ➡️ `timeline` | 補齊結算 API，使伺服器端扣減耐久度與結算經驗/金幣，並輸出詳細日誌。 |
| **自動鍛造** | 查詢 `/api/forge/jobs` 判定是否在鍛造 | 依賴 character 回傳的舊欄位 | 串接新 jobs 查詢，修復鍛造無法完成的卡死 Bug。 |
| **自動採礦** | 查詢 `/api/town/mine/status` | 無此功能 | 新增自動採礦模組與背景 30 秒輪詢與採收功能。 |
| **裝備回收** | 呼叫 `/api/forge/recycle/{id}` | 被註解，只打印 Log | 解開 API 限制，恢復真實的批量分解功能。 |
| **回城練級** | 無此機制 | 僅在超出層數時回城，未休息就立刻回到野外 | 實作「**自動回城滿狀態再出發**」循環。抵達指定層數回城 ➡️ 自動休息補滿 HP/SP ➡️ 重新前往草原 1F，實現無限練級。 |

---

## 3. 防衝突與共存規則 (Mutex & Concurrency Rules)

為了防止多個自動化腳本同時發起請求導致後端衝突報錯，本重構落實以下邏輯：

1. **戰鬥與採礦互斥 (Conflict Mutual Exclusion)**:
   * 角色在城鎮採礦時不能進行塔內戰鬥，在塔內戰鬥時亦不能採礦。
   * 自動戰鬥啟動前，若自動採礦已開啟，則拒絕啟動戰鬥。
   * 自動採礦開啟前，若自動戰鬥已開啟，則暫停採礦背景發送。
   * 角色在採礦時（`actionStatus === "採礦"`），狀態檢查器會阻擋自動戰鬥，進入等待狀態。
2. **製作 (鍛造) 與戰鬥/採礦共存 (Coexistence)**:
   * 允許人物一邊打怪（或採礦），一邊在背景進行裝備鍛造。
   * 重構 `statusChecker.js`：當 `actionStatus === "鍛造"` 時，不判定為忙碌（回傳 `true`），使戰鬥或採礦不被中斷；當鍛造時間到，會在背景自動完成結算。

---

## 4. 自訂防護與吃藥邏輯優化

* **自訂恢復模式**：
  * 使用者可以針對 HP 與 MP 門檻各自設定要「使用補品 (吃藥)」還是「自動休息 (回城休息/原地休息)」。
* **防呆降級機制**：
  * 當模式設定為「吃藥」，但背包中已無藥水或吃藥後仍無法高於設定門檻時，腳本會自動將其降級執行「自動休息」，避免角色卡死或被打死。
