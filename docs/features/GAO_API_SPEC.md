# Gun Art Online (GAO) 新版 API 完整盤點文件

## 1. 認證系統 (Authentication)
*   **登入**: `POST /api/auth/login`
*   **Header**: `Authorization: Bearer <token>`
*   **登入回傳結構**:
    ```json
    {
      "token": "...",
      "user": { "id": 899, "username": "ja0970", "role": "player" },
      "character": {
        "name": "logggggix",
        "level": 1,
        "hp": 500, "maxHp": 500,
        "mp": 100, "maxMp": 100,
        "strength": 0, "statPoints": 10,
        "gold": 0, "floor": 1
      }
    }
    ```

## 2. 個人資訊與狀態 (Character & Status)
*   **獲取個人資訊**: `GET /api/character` (由登入回傳或定時刷新)
*   **塔內狀態 (座標/地圖)**: `GET /api/tower/status`
    *   `zone`: 目前區域 (例如 `starting_town`)
    *   `zones`: 可移動區域清單
    *   `restStartedAt`: 休息開始時間 (用於判斷是否正在休息)
    *   `moveEndsAt`: 移動結束時間

## 3. 背包與裝備 (Inventory & Equipment)
*   **基礎背包**: `GET /api/inventory`
*   **詳細裝備清單**: `GET /api/forge/equipment`
    *   欄位: `id`, `weapon_name`, `durability`, `atk`, `def`
*   **穿上裝備**: `POST /api/inventory/equip` (需驗證 body 參數)
*   **彈藥資訊**: `GET /api/inventory/ammo`

## 4. 戰鬥系統 (Battle)
*   **戰報列表**: `GET /api/battles`
*   **戰鬥動作**: `POST /api/battles` (需進一步攔截 POST body 以確認參數，如 `type: 1`)

## 5. 技能系統 (Skills)
*   **技能清單**: `GET /api/skills`
    *   `available`: 可用技能
    *   `equipped`: 已裝備技能 (4 個 Slot)

## 6. 鍛造系統 (Forge)
*   **配方清單**: `GET /api/forge/recipes`
    *   包含所需材料數量 (`required_quantity`)
*   **鍛造工作狀態**: `GET /api/forge/jobs` (定時輪詢，頻率約 10 秒一次)

## 7. 系統功能
*   **公告**: `GET /api/announcements`
*   **在線玩家**: `GET /api/tower/players`
*   **輪詢/心跳**: `GET /api/tower/poll`
