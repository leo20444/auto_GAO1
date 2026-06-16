# 背包系統功能文件

## 1. API 定義
*   **基礎道具**: `/api/inventory` (GET) - 回傳消耗品、材料。
*   **詳細裝備**: `/api/forge/equipment` (GET) - 回傳所有持有的武器防具。
*   **目前裝備**: `/api/equip` (GET) - 回傳角色身上穿戴的裝備。

## 2. 裝備屬性說明
| 屬性 | 說明 |
| :--- | :--- |
| `weapon_name` | 裝備名稱 |
| `durability` | 目前耐久度 |
| `max_durability` | 最大耐久度 |
| `atk` / `def` | 攻擊與防禦加成 |
| `hand_type` | 手持類型 (`one_hand` / `two_hand`) |

## 3. 操作動作
*   **穿上**: `POST /api/inventory/equip` (Body: `{ equipmentId: ID }`)
*   **卸下**: `POST /api/inventory/unequip` (Body: `{ equipmentId: ID }`)
*   **回收**: `POST /api/inventory/recycle` (Body: `{ equipmentId: ID }`)
