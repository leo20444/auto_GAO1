# 戰鬥與爬塔系統文件

## 1. 爬塔狀態 (/api/tower/status)
*   **zone**: 目前區域代碼 (如 `starting_town`, `great_plains`)。
*   **floor**: 目前層數。
*   **restStartedAt**: 若不為 null，表示正在休息。
*   **moveEndsAt**: 若不為 null，表示正在移動。

## 2. 戰鬥動作 (/api/battles)
*   **方法**: `POST`
*   **參數**: `{ type: 1 }` (戰鬥) 或 `{ type: 2 }` (趕路/逃跑)。
*   **回傳**: 戰鬥結果與獎勵。

## 3. 移動動作 (/api/tower/move)
*   **方法**: `POST`
*   **參數**: `{ zone: "zone_key" }` (例如 `great_plains`)。
*   **自動化邏輯**: 必須在 `moveEndsAt` 時間過後，呼叫 `POST /api/tower/move/complete` 才能真正到達。
