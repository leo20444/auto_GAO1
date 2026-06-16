# 技能與鍛造系統文件

## 1. 技能系統 (/api/skills)
*   **available**: 角色已學會的技能。
*   **equipped**: 裝備中的技能（4 個位置）。

## 2. 鍛造系統 (/api/forge)
*   **配方**: `/api/forge/recipes` (GET) - 顯示所需材料數量。
*   **開始鍛造**: `POST /api/forge` (需帶入配方與材料 ID)。
*   **領取**: `POST /api/forge/complete`。
*   **鍛造進度**: `/api/forge/jobs` (GET) - 檢查是否鍛造完成。
