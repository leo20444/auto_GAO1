# 個人資訊功能文件

## 1. API 定義
*   **端點**: `/api/character`
*   **方法**: `GET`
*   **認證**: `Authorization: Bearer <token>`

## 2. 關鍵欄位說明
| 欄位名 | 類型 | 說明 |
| :--- | :--- | :--- |
| `name` | String | 角色名稱 |
| `level` | Number | 角色等級 |
| `hp` / `maxHp` | Number | 目前血量與最大血量 |
| `mp` / `maxMp` | Number | 目前法力與最大法力 |
| `statPoints` | Number | 剩餘屬性點數 |
| `gold` | Number | 持有金幣 |
| `floor` | Number | 目前所在塔層數 |

## 3. 備註
*   此 API 用於顯示主介面的數值，數值變更（如升級、扣血）需重新呼叫此端點或由其他 Action API 回傳。
