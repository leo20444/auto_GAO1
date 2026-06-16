# 1. 個人資訊 (Character/Profile)
*   **端點**: `/api/character`
*   **方法**: `GET`
*   **認證**: `Authorization: Bearer <token>`
*   **資料結構關鍵欄位**:
    *   `name`: 角色名稱
    *   `level`: 等級
    *   `hp / maxHp`: 生命值
    *   `mp / maxMp`: 法力值
    *   `exp`: 經驗值
    *   `gold`: 金幣

# 2. 背包系統 (Inventory/Items)
*   **端點**: `/api/inventory`
*   **方法**: `GET`
*   **子功能**:
    *   `equipments`: 裝備列表
    *   `items`: 消耗品列表
    *   `materials`: 材料列表

# 3. 戰鬥系統 (Battle)
*   **端點**: `/api/battles`
*   **方法**: `GET` (取得記錄) / `POST` (執行動作)
*   **說明**: 原本的 `/hunt` 可能已整合至此。

# 4. 爬塔系統 (Tower)
*   **端點**: `/api/tower` (待驗證)
*   **說明**: 新版 GAO 的特色功能，需攔截封包確認。

# 5. 技能系統 (Skills)
*   **端點**: `/api/skills` (待驗證)

# 6. 鍛造系統 (Forge)
*   **端點**: `/api/forge`
*   **說明**: 包含鍛造裝備、領取完成品等動作。
