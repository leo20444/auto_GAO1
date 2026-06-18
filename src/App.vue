<script lang="ts" setup>
import { ref, reactive } from "vue";
import { RouterView } from "vue-router";
import { useAccountStore } from "./store/accountStore";
import { ElMessageBox, ElMessage } from "element-plus";
import { Plus, User, Delete } from "@element-plus/icons-vue";

const {
  accounts,
  selectedAccountIndex,
  addAccount,
  removeAccount,
  selectAccount,
} = useAccountStore();

const handleAddAccount = () => {
  ElMessageBox.prompt("請輸入新的 Token", "新增帳號", {
    confirmButtonText: "新增",
    cancelButtonText: "取消",
    inputPlaceholder: "eyJhbGci...",
  })
    .then(({ value }) => {
      if (value) {
        addAccount(value);
        ElMessage.success("帳號已新增");
      }
    })
    .catch(() => {
      // User cancelled or closed the prompt
    });
};

const handleDeleteAccount = (index: number, event: Event) => {
  event.stopPropagation();
  ElMessageBox.confirm("確定要移除此帳號嗎？", "警告", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      removeAccount(index);
      ElMessage.info("帳號已移除");
    })
    .catch(() => {
      // User cancelled or closed the confirmation
    });
};

const showBackupDialog = ref(false);
const backupActiveTab = ref("export");
const importFileInput = ref<HTMLInputElement | null>(null);
const parsedImportData = ref<any>(null);

const exportOptions = reactive({
  tokens: true,
  settings: true,
  forgeFavorites: true,
});

const importOptions = reactive({
  tokens: true,
  settings: true,
  forgeFavorites: true,
});

const handleExport = () => {
  const exportData: any = {};

  if (exportOptions.tokens) {
    const tokens = JSON.parse(localStorage.getItem("strList") || "[]");
    exportData.tokens = tokens;
  }

  if (exportOptions.settings) {
    const settings: Record<string, any> = {};
    const tokens = JSON.parse(localStorage.getItem("strList") || "[]");
    tokens.forEach((token: string) => {
      const stored = localStorage.getItem(`setting_${token}`);
      if (stored) {
        try {
          settings[token] = JSON.parse(stored);
        } catch (e) {
          settings[token] = stored;
        }
      }
    });
    exportData.settings = settings;
  }

  if (exportOptions.forgeFavorites) {
    const forgeFavorites: Record<string, any> = {};
    const tokens = JSON.parse(localStorage.getItem("strList") || "[]");
    tokens.forEach((token: string) => {
      const stored = localStorage.getItem(`forge_favorites_${token}`);
      if (stored) {
        try {
          forgeFavorites[token] = JSON.parse(stored);
        } catch (e) {
          forgeFavorites[token] = stored;
        }
      }
    });
    exportData.forgeFavorites = forgeFavorites;
  }

  if (Object.keys(exportData).length === 0) {
    ElMessage.warning("請至少選擇一個項目進行匯出");
    return;
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GAO_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  ElMessage.success("備份檔案生成成功並已下載");
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target?.result as string);
      parsedImportData.value = parsed;
      importOptions.tokens = !!parsed.tokens;
      importOptions.settings = !!parsed.settings;
      importOptions.forgeFavorites = !!parsed.forgeFavorites;
    } catch (error) {
      ElMessage.error("JSON 格式無效，請選擇正確的備份檔案");
      parsedImportData.value = null;
    }
  };
  reader.readAsText(file);
};

const handleImport = () => {
  if (!parsedImportData.value) return;

  const data = parsedImportData.value;
  let importedCount = 0;

  if (importOptions.tokens && data.tokens) {
    localStorage.setItem("strList", JSON.stringify(data.tokens));
    importedCount++;
  }

  if (importOptions.settings && data.settings) {
    Object.keys(data.settings).forEach((token) => {
      const settingVal = data.settings[token];
      localStorage.setItem(
        `setting_${token}`,
        typeof settingVal === "string" ? settingVal : JSON.stringify(settingVal)
      );
    });
    importedCount++;
  }

  if (importOptions.forgeFavorites && data.forgeFavorites) {
    Object.keys(data.forgeFavorites).forEach((token) => {
      const favVal = data.forgeFavorites[token];
      localStorage.setItem(
        `forge_favorites_${token}`,
        typeof favVal === "string" ? favVal : JSON.stringify(favVal)
      );
    });
    importedCount++;
  }

  if (importedCount === 0) {
    ElMessage.warning("未勾選或無可還原項目");
    return;
  }

  ElMessage.success("還原成功！網頁即將重新整理以套用新設定。");
  setTimeout(() => {
    window.location.reload();
  }, 1500);
};
</script>

<template>
  <el-container class="app-container">
    <el-aside width="260px" class="sidebar">
      <div class="sidebar-header">
        <h2 class="title">GAO Dashboard</h2>
        <el-button :icon="Plus" circle @click="handleAddAccount" />
      </div>

      <el-scrollbar>
        <div class="account-list">
          <div
            v-for="(acc, index) in accounts"
            :key="acc.token"
            :class="[
              'account-item',
              { active: selectedAccountIndex === index },
            ]"
            @click="selectAccount(index)"
          >
            <div class="account-avatar">
              <el-avatar
                :icon="User"
                :size="40"
                :style="{
                  backgroundColor: acc.profile.avatarColor || '#409EFF',
                }"
              />
            </div>
            <div class="account-info">
              <div class="account-name">
                {{ acc.profile.nickname || "未載入" }}
              </div>
              <div class="account-stats">
                <el-progress
                  :percentage="
                    acc.profile.fullHp
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (acc.profile.hp / acc.profile.fullHp) * 100
                          )
                        )
                      : 0
                  "
                  :show-text="false"
                  status="exception"
                  class="mini-bar"
                />
                <el-progress
                  :percentage="
                    acc.profile.fullSp
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (acc.profile.sp / acc.profile.fullSp) * 100
                          )
                        )
                      : 0
                  "
                  :show-text="false"
                  class="mini-bar"
                />
              </div>
            </div>
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              class="delete-btn"
              @click="handleDeleteAccount(index, $event)"
            />
          </div>

          <div v-if="accounts.length === 0" class="empty-state">
            尚未新增帳號
          </div>
        </div>
      </el-scrollbar>

      <div class="sidebar-footer">
        <el-button
          type="info"
          size="small"
          plain
          @click="showBackupDialog = true"
          style="width: 100%; margin-bottom: 8px"
        >
          配置備份與還原
        </el-button>
        <span class="version-text">v1.0.0-Modern</span>
      </div>
    </el-aside>

    <el-main class="main-content">
      <RouterView />
    </el-main>

    <!-- 配置備份與還原對話框 -->
    <el-dialog
      v-model="showBackupDialog"
      title="配置備份與還原"
      width="500px"
      class="backup-dialog"
    >
      <el-tabs v-model="backupActiveTab">
        <!-- 匯出面板 -->
        <el-tab-pane label="匯出配置" name="export">
          <div style="margin-bottom: 15px">
            <p
              style="
                font-size: 13px;
                color: var(--text-secondary);
                margin-bottom: 12px;
              "
            >
              請勾選欲匯出的設定項目：
            </p>
            <el-checkbox v-model="exportOptions.tokens"
              >帳號 Token 清單</el-checkbox
            >
            <br />
            <el-checkbox v-model="exportOptions.settings"
              >帳號自動化設定檔</el-checkbox
            >
            <br />
            <el-checkbox v-model="exportOptions.forgeFavorites"
              >鍛造組合收藏匣</el-checkbox
            >
          </div>
          <el-button type="primary" @click="handleExport" style="width: 100%">
            生成備份並下載
          </el-button>
        </el-tab-pane>

        <!-- 匯入面板 -->
        <el-tab-pane label="匯入配置" name="import">
          <div style="margin-bottom: 15px">
            <p
              style="
                font-size: 13px;
                color: var(--text-secondary);
                margin-bottom: 12px;
              "
            >
              步驟 1：選擇備份 JSON 檔案
            </p>
            <input
              type="file"
              ref="importFileInput"
              accept=".json"
              @change="handleFileChange"
              style="margin-bottom: 12px"
            />

            <div v-if="parsedImportData" style="margin-top: 15px">
              <p
                style="
                  font-size: 13px;
                  color: var(--text-secondary);
                  margin-bottom: 8px;
                "
              >
                步驟 2：請勾選欲還原的項目：
              </p>
              <el-checkbox
                v-model="importOptions.tokens"
                :disabled="!parsedImportData.tokens"
              >
                還原 Token 清單 (共
                {{ parsedImportData.tokens?.length || 0 }} 筆)
              </el-checkbox>
              <br />
              <el-checkbox
                v-model="importOptions.settings"
                :disabled="!parsedImportData.settings"
              >
                還原自動化設定檔
              </el-checkbox>
              <br />
              <el-checkbox
                v-model="importOptions.forgeFavorites"
                :disabled="!parsedImportData.forgeFavorites"
              >
                還原鍛造組合收藏匣
              </el-checkbox>
            </div>
          </div>
          <el-button
            type="success"
            :disabled="!parsedImportData"
            @click="handleImport"
            style="width: 100%"
          >
            確認還原配置
          </el-button>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </el-container>
</template>

<style>
:root {
  --sidebar-bg: #1a1c1e;
  --sidebar-item-active: #2c2e31;
  --sidebar-item-hover: #242629;
  --text-primary: #e1e2e4;
  --text-secondary: #9ea0a4;
}

body {
  margin: 0;
  font-family: "Inter", sans-serif;
  background-color: #0d0f11;
  color: var(--text-primary);
}

.app-container {
  height: 100vh;
}

.sidebar {
  background-color: var(--sidebar-bg);
  border-right: 1px solid #2d2f31;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2d2f31;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #00cdf0;
}

.account-list {
  padding: 10px;
}

.account-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 1px solid transparent;
}

.account-item:hover {
  background-color: var(--sidebar-item-hover);
}

.account-item.active {
  background-color: var(--sidebar-item-active);
  border-color: #00cdf033;
  box-shadow: 0 0 10px #00cdf011;
}

.account-info {
  margin-left: 12px;
  flex: 1;
  overflow: hidden;
}

.account-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.account-stats {
  margin-top: 4px;
}

.mini-bar {
  margin-bottom: 2px;
}

.mini-bar .el-progress-bar__outer {
  height: 4px !important;
  background-color: #333 !important;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
  margin-left: 8px;
}

.account-item:hover .delete-btn {
  opacity: 1;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid #2d2f31;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.main-content {
  padding: 0;
  background-color: #0d0f11;
}

:deep(.el-dialog.backup-dialog),
:deep(.backup-dialog) {
  background-color: #141619 !important;
  border: 1px solid #2d2f31 !important;
  border-radius: 8px;
}
:deep(.backup-dialog .el-dialog__title) {
  color: #fff !important;
}
:deep(.backup-dialog .el-tabs__item) {
  color: var(--text-secondary) !important;
}
:deep(.backup-dialog .el-tabs__item.is-active) {
  color: #00cdf0 !important;
}
:deep(.backup-dialog .el-checkbox) {
  color: var(--text-primary) !important;
  margin-bottom: 8px;
}
</style>
