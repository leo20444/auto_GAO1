<template>
  <div>
    <el-row align="middle" style="margin-bottom: 12px">
      <el-col :span="12">
        <h3 style="margin: 0">裝備選擇</h3>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-space>
          <el-switch
            v-model="equipmentCheck"
            @change="handleEquipmentCheck"
            active-text="啟用裝備管理"
            inactive-text="停用"
            inline-prompt
          />
        </el-space>
      </el-col>
    </el-row>

    <transition name="el-zoom-in-top" mode="out-in">
      <div v-show="equipmentCheck">
        <!-- 佇列啟用勾選區 -->
        <el-row style="margin-bottom: 12px" align="middle">
          <el-col :span="24">
            <div class="queue-toggles">
              <span class="queue-toggles-label">啟用佇列：</span>
              <el-checkbox
                v-model="enableMainQueue"
                @change="onQueueToggleChange"
              >
                主手佇列
              </el-checkbox>
              <el-checkbox
                v-model="enableOffQueue"
                @change="onQueueToggleChange"
              >
                副手佇列
              </el-checkbox>
              <el-checkbox
                v-model="enableArmorQueue"
                @change="onQueueToggleChange"
              >
                防具佇列
              </el-checkbox>
            </div>
          </el-col>
        </el-row>

        <!-- 篩選區 + 武器/防具池 -->
        <el-row :gutter="12" style="margin-bottom: 12px" align="middle">
          <el-col
            :xs="24"
            :sm="8"
            style="margin-bottom: 10px; sm-margin-bottom: 0"
          >
            <div class="input-label">裝備類型篩選</div>
            <el-select
              v-model="selectedType"
              placeholder="全部類型"
              clearable
              style="width: 100%"
            >
              <el-option label="全部" value="" />
              <el-option v-for="t in allTypes" :key="t" :label="t" :value="t" />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="16">
            <div
              class="input-label"
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <span>選擇裝備（點擊按鈕加入對應佇列）</span>
              <span
                v-if="!selectedType && (props.weaponList || []).length > 80"
                style="font-size: 11px; color: #909399; font-weight: normal"
              >
                (僅顯示前 80 筆，請使用左側篩選精確查找)
              </span>
            </div>
            <div class="weapon-pool">
              <div
                v-for="weapon in filteredWeapons"
                :key="weapon.id"
                class="weapon-chip"
              >
                <span class="weapon-chip-name">{{ weapon.name }}</span>
                <span class="weapon-chip-meta">
                  <template v-if="typeList.armor.includes(weapon.typeName)">
                    [防具 · {{ weapon.typeName }}]
                  </template>
                  <template v-else>
                    [{{ weapon.hand_type === "two_hand" ? "雙手" : "單手" }} ·
                    {{ weapon.typeName }}]
                  </template>
                  耐久: {{ weapon.durability }}
                </span>

                <!-- 裝備分流按鈕（使用原生按鈕以獲得極佳渲染效能） -->
                <span style="margin-left: 10px; display: inline-flex; gap: 4px">
                  <!-- 主手按鈕 -->
                  <button
                    v-if="
                      enableMainQueue &&
                      !typeList.armor.includes(weapon.typeName)
                    "
                    class="weapon-btn weapon-btn-main"
                    @click.stop="addToQueueMain(weapon)"
                  >
                    +主手
                  </button>
                  <!-- 副手按鈕 -->
                  <button
                    v-if="
                      enableOffQueue &&
                      weapon.hand_type !== 'two_hand' &&
                      !typeList.armor.includes(weapon.typeName)
                    "
                    class="weapon-btn weapon-btn-off"
                    @click.stop="addToQueueOff(weapon)"
                  >
                    +副手
                  </button>
                  <!-- 防具按鈕 -->
                  <button
                    v-if="
                      enableArmorQueue &&
                      typeList.armor.includes(weapon.typeName)
                    "
                    class="weapon-btn weapon-btn-armor"
                    @click.stop="addToQueueArmor(weapon)"
                  >
                    +防具
                  </button>
                </span>
              </div>
              <div v-if="filteredWeapons.length === 0" class="empty-pool">
                無符合的裝備
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 三佇列並排區 -->
        <el-row :gutter="16">
          <!-- 主手武器佇列 -->
          <el-col
            v-if="enableMainQueue"
            :xs="24"
            :sm="activeQueueCount === 1 ? 24 : activeQueueCount === 2 ? 12 : 8"
            style="margin-bottom: 15px"
          >
            <div class="queue-section queue-section--main">
              <div class="queue-header">
                <span class="queue-title">
                  <span class="queue-badge queue-badge--main">主手</span>
                  武器替換佇列
                </span>
                <el-button
                  v-if="selectedWeaponQueueMain.length > 0"
                  type="danger"
                  size="small"
                  plain
                  @click="clearQueueMain"
                  >清空</el-button
                >
              </div>

              <div
                v-if="selectedWeaponQueueMain.length === 0"
                class="empty-queue"
              >
                點擊上方武器 [+主手] 加入
              </div>

              <div v-else class="queue-list">
                <div
                  v-for="(weapon, idx) in selectedWeaponQueueMain"
                  :key="weapon.id"
                  class="queue-item"
                >
                  <span class="queue-order">{{ idx + 1 }}</span>
                  <div class="queue-item-info">
                    <span class="queue-name">{{ weapon.name }}</span>
                    <span class="queue-meta">
                      [{{ weapon.hand_type === "two_hand" ? "雙手" : "單手" }} ·
                      {{ weapon.typeName }}] 耐久: {{ weapon.durability }}/{{
                        weapon.fullDurability
                      }}
                    </span>
                  </div>
                  <div class="queue-actions">
                    <el-button
                      size="small"
                      :disabled="idx === 0"
                      @click="moveUpMain(idx)"
                      circle
                      plain
                      :icon="ArrowUp"
                    />
                    <el-button
                      size="small"
                      :disabled="idx === selectedWeaponQueueMain.length - 1"
                      @click="moveDownMain(idx)"
                      circle
                      plain
                      :icon="ArrowDown"
                    />
                    <el-button
                      size="small"
                      type="danger"
                      @click="removeFromQueueMain(idx)"
                      circle
                      plain
                      :icon="Delete"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 副手武器佇列 -->
          <el-col
            v-if="enableOffQueue"
            :xs="24"
            :sm="activeQueueCount === 1 ? 24 : activeQueueCount === 2 ? 12 : 8"
            style="margin-bottom: 15px"
          >
            <div class="queue-section queue-section--off">
              <div class="queue-header">
                <span class="queue-title">
                  <span class="queue-badge queue-badge--off">副手</span>
                  武器替換佇列
                </span>
                <el-button
                  v-if="selectedWeaponQueueOff.length > 0"
                  type="danger"
                  size="small"
                  plain
                  @click="clearQueueOff"
                  >清空</el-button
                >
              </div>

              <div
                v-if="selectedWeaponQueueOff.length === 0"
                class="empty-queue"
              >
                點擊上方單手武器 [+副手] 加入
              </div>

              <div v-else class="queue-list">
                <div
                  v-for="(weapon, idx) in selectedWeaponQueueOff"
                  :key="weapon.id"
                  class="queue-item"
                >
                  <span class="queue-order queue-order--off">{{
                    idx + 1
                  }}</span>
                  <div class="queue-item-info">
                    <span class="queue-name">{{ weapon.name }}</span>
                    <span class="queue-meta">
                      [單手 · {{ weapon.typeName }}] 耐久:
                      {{ weapon.durability }}/{{ weapon.fullDurability }}
                    </span>
                  </div>
                  <div class="queue-actions">
                    <el-button
                      size="small"
                      :disabled="idx === 0"
                      @click="moveUpOff(idx)"
                      circle
                      plain
                      :icon="ArrowUp"
                    />
                    <el-button
                      size="small"
                      :disabled="idx === selectedWeaponQueueOff.length - 1"
                      @click="moveDownOff(idx)"
                      circle
                      plain
                      :icon="ArrowDown"
                    />
                    <el-button
                      size="small"
                      type="danger"
                      @click="removeFromQueueOff(idx)"
                      circle
                      plain
                      :icon="Delete"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 防具佇列 -->
          <el-col
            v-if="enableArmorQueue"
            :xs="24"
            :sm="activeQueueCount === 1 ? 24 : activeQueueCount === 2 ? 12 : 8"
            style="margin-bottom: 15px"
          >
            <div class="queue-section queue-section--armor">
              <div class="queue-header">
                <span class="queue-title">
                  <span class="queue-badge queue-badge--armor">防具</span>
                  替換佇列
                </span>
                <el-button
                  v-if="selectedArmorQueue.length > 0"
                  type="danger"
                  size="small"
                  plain
                  @click="clearQueueArmor"
                  >清空</el-button
                >
              </div>

              <div v-if="selectedArmorQueue.length === 0" class="empty-queue">
                點擊上方防具 [+防具] 加入
              </div>

              <div v-else class="queue-list">
                <div
                  v-for="(armor, idx) in selectedArmorQueue"
                  :key="armor.id"
                  class="queue-item"
                >
                  <span class="queue-order queue-order--armor">{{
                    idx + 1
                  }}</span>
                  <div class="queue-item-info">
                    <span class="queue-name">{{ armor.name }}</span>
                    <span class="queue-meta">
                      [防具 · {{ armor.typeName }}] 耐久:
                      {{ armor.durability }}/{{ armor.fullDurability }}
                    </span>
                  </div>
                  <div class="queue-actions">
                    <el-button
                      size="small"
                      :disabled="idx === 0"
                      @click="moveUpArmor(idx)"
                      circle
                      plain
                      :icon="ArrowUp"
                    />
                    <el-button
                      size="small"
                      :disabled="idx === selectedArmorQueue.length - 1"
                      @click="moveDownArmor(idx)"
                      circle
                      plain
                      :icon="ArrowDown"
                    />
                    <el-button
                      size="small"
                      type="danger"
                      @click="removeFromQueueArmor(idx)"
                      circle
                      plain
                      :icon="Delete"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits, computed, watch } from "vue";
import { ArrowUp, ArrowDown, Delete } from "@element-plus/icons-vue";
import typeList from "../common/typeList";

const props = defineProps({
  weaponList: Array,
  selectedWeaponQueueMain: Array,
  selectedWeaponQueueOff: Array,
  selectedArmorQueue: Array,
  weaponCheckTag: Boolean,
  armorCheckTag: Boolean,
  equipmentCheckTag: Boolean,
  enableDualWield: Boolean,
});

const emits = defineEmits([
  "equipment-check",
  "update-check-weapon",
  "update-check-armor",
  "equipment-check-off",
  "update:selected-weapon-queue-main",
  "update:selected-weapon-queue-off",
  "update:selected-armor-queue",
]);

// 裝備管理開關
const equipmentCheck = ref(props.equipmentCheckTag ?? true);

// 三佇列啟用狀態（取代舊的 checkWeapon / checkArmor）
const enableMainQueue = ref(props.weaponCheckTag ?? false);
const enableOffQueue = ref(props.enableDualWield ?? false);
const enableArmorQueue = ref(props.armorCheckTag ?? false);

// 計算目前啟用的佇列數量（用於響應式欄寬）
const activeQueueCount = computed(() => {
  let count = 0;
  if (enableMainQueue.value) count++;
  if (enableOffQueue.value) count++;
  if (enableArmorQueue.value) count++;
  return count || 1;
});

const selectedWeaponQueueMain = ref<any[]>([]);
const selectedWeaponQueueOff = ref<any[]>([]);
const selectedArmorQueue = ref<any[]>([]);

// 同步 props 變化
watch(
  () => props.equipmentCheckTag,
  (v) => {
    equipmentCheck.value = v ?? true;
  }
);
watch(
  () => props.weaponCheckTag,
  (v) => {
    enableMainQueue.value = v ?? false;
  }
);
watch(
  () => props.armorCheckTag,
  (v) => {
    enableArmorQueue.value = v ?? false;
  }
);
watch(
  () => props.enableDualWield,
  (v) => {
    enableOffQueue.value = v ?? false;
  }
);
watch(
  () => props.selectedWeaponQueueMain,
  (v) => {
    selectedWeaponQueueMain.value = v ? [...v] : [];
  },
  { immediate: true, deep: true }
);
watch(
  () => props.selectedWeaponQueueOff,
  (v) => {
    selectedWeaponQueueOff.value = v ? [...v] : [];
  },
  { immediate: true, deep: true }
);
watch(
  () => props.selectedArmorQueue,
  (v) => {
    selectedArmorQueue.value = v ? [...v] : [];
  },
  { immediate: true, deep: true }
);

// 勾選變更時，同步回父元件（連動 weaponCheckTag / armorCheckTag / enableDualWield）
const onQueueToggleChange = () => {
  emits("update-check-weapon", enableMainQueue.value);
  emits("update-check-armor", enableArmorQueue.value);
  // 副手勾選連動 enableDualWield
  emits("equipment-check-off", enableOffQueue.value);
};

// 類型篩選
const selectedType = ref("");

// 所有可用的武器類型（從 weaponList 動態抽取 + typeList）
const allTypes = computed(() => {
  const fromList = (props.weaponList || [])
    .map((w: any) => w.typeName)
    .filter(Boolean);
  const merged = new Set([...typeList.weapon, ...typeList.armor, ...fromList]);
  return Array.from(merged);
});

// 篩選後的可選裝備（排除已在任一佇列中的裝備）
const filteredWeapons = computed(() => {
  const list: any[] = props.weaponList || [];
  const unselected = list.filter((w: any) => !isInQueue(w.id));
  if (!selectedType.value) {
    // 預設無篩選時限制僅顯示前 80 筆，極大提升大量裝備時的渲染效能與點開流暢度
    return unselected.slice(0, 80);
  }
  return unselected.filter((w: any) => w.typeName === selectedType.value);
});

// 判斷裝備是否已在任一佇列中
const isInQueue = (id: any) =>
  selectedWeaponQueueMain.value.some((w) => w.id === id) ||
  selectedWeaponQueueOff.value.some((w) => w.id === id) ||
  selectedArmorQueue.value.some((w) => w.id === id);

// 事件轉發
const emitMain = () => {
  emits("update:selected-weapon-queue-main", [
    ...selectedWeaponQueueMain.value,
  ]);
};
const emitOff = () => {
  emits("update:selected-weapon-queue-off", [...selectedWeaponQueueOff.value]);
};
const emitArmor = () => {
  emits("update:selected-armor-queue", [...selectedArmorQueue.value]);
};

// 加入主手佇列
const addToQueueMain = (weapon: any) => {
  if (selectedWeaponQueueMain.value.some((w) => w.id === weapon.id)) return;
  selectedWeaponQueueMain.value.push({ ...weapon });
  emitMain();
};

// 加入副手佇列
const addToQueueOff = (weapon: any) => {
  if (selectedWeaponQueueOff.value.some((w) => w.id === weapon.id)) return;
  selectedWeaponQueueOff.value.push({ ...weapon });
  emitOff();
};

// 加入防具佇列
const addToQueueArmor = (armor: any) => {
  if (selectedArmorQueue.value.some((w) => w.id === armor.id)) return;
  selectedArmorQueue.value.push({ ...armor });
  emitArmor();
};

// 從主手移除
const removeFromQueueMain = (idx: number) => {
  selectedWeaponQueueMain.value.splice(idx, 1);
  emitMain();
};
// 從副手移除
const removeFromQueueOff = (idx: number) => {
  selectedWeaponQueueOff.value.splice(idx, 1);
  emitOff();
};
// 從防具移除
const removeFromQueueArmor = (idx: number) => {
  selectedArmorQueue.value.splice(idx, 1);
  emitArmor();
};

// 主手排程上移
const moveUpMain = (idx: number) => {
  if (idx === 0) return;
  const tmp = selectedWeaponQueueMain.value[idx - 1];
  selectedWeaponQueueMain.value[idx - 1] = selectedWeaponQueueMain.value[idx];
  selectedWeaponQueueMain.value[idx] = tmp;
  emitMain();
};
// 主手排程下移
const moveDownMain = (idx: number) => {
  if (idx >= selectedWeaponQueueMain.value.length - 1) return;
  const tmp = selectedWeaponQueueMain.value[idx + 1];
  selectedWeaponQueueMain.value[idx + 1] = selectedWeaponQueueMain.value[idx];
  selectedWeaponQueueMain.value[idx] = tmp;
  emitMain();
};

// 副手排程上移
const moveUpOff = (idx: number) => {
  if (idx === 0) return;
  const tmp = selectedWeaponQueueOff.value[idx - 1];
  selectedWeaponQueueOff.value[idx - 1] = selectedWeaponQueueOff.value[idx];
  selectedWeaponQueueOff.value[idx] = tmp;
  emitOff();
};
// 副手排程下移
const moveDownOff = (idx: number) => {
  if (idx >= selectedWeaponQueueOff.value.length - 1) return;
  const tmp = selectedWeaponQueueOff.value[idx + 1];
  selectedWeaponQueueOff.value[idx + 1] = selectedWeaponQueueOff.value[idx];
  selectedWeaponQueueOff.value[idx] = tmp;
  emitOff();
};

// 防具排程上移
const moveUpArmor = (idx: number) => {
  if (idx === 0) return;
  const tmp = selectedArmorQueue.value[idx - 1];
  selectedArmorQueue.value[idx - 1] = selectedArmorQueue.value[idx];
  selectedArmorQueue.value[idx] = tmp;
  emitArmor();
};
// 防具排程下移
const moveDownArmor = (idx: number) => {
  if (idx >= selectedArmorQueue.value.length - 1) return;
  const tmp = selectedArmorQueue.value[idx + 1];
  selectedArmorQueue.value[idx + 1] = selectedArmorQueue.value[idx];
  selectedArmorQueue.value[idx] = tmp;
  emitArmor();
};

// 清空各佇列
const clearQueueMain = () => {
  selectedWeaponQueueMain.value = [];
  emitMain();
};
const clearQueueOff = () => {
  selectedWeaponQueueOff.value = [];
  emitOff();
};
const clearQueueArmor = () => {
  selectedArmorQueue.value = [];
  emitArmor();
};

const handleEquipmentCheck = () => emits("equipment-check");
</script>

<style scoped>
.input-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  font-weight: 600;
}

/* 佇列啟用勾選列 */
.queue-toggles {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: #1a1d22;
  border: 1px solid #2d2f31;
  border-radius: 6px;
  flex-wrap: wrap;
}

.queue-toggles-label {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  white-space: nowrap;
}

/* 武器池 */
.weapon-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 44px;
  padding: 8px;
  background: #1a1d22;
  border: 1px solid #2d2f31;
  border-radius: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.weapon-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 16px;
  border: 1px solid #3a3d42;
  background: #23262b;
  font-size: 12px;
  user-select: none;
}

.weapon-chip-name {
  font-weight: 600;
  color: #e0e0e0;
}

.weapon-chip-meta {
  color: #606266;
  font-size: 11px;
}

.empty-pool {
  color: #606266;
  font-size: 12px;
  padding: 8px;
}

/* 佇列區 */
.queue-section {
  border: 1px solid #2d2f31;
  border-radius: 8px;
  padding: 12px;
  background: #141619;
  min-height: 120px;
}

.queue-section--main {
  border-color: #3a5a8a;
}

.queue-section--off {
  border-color: #3a6a4a;
}

.queue-section--armor {
  border-color: #7a5a2a;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.queue-title {
  font-size: 13px;
  font-weight: 600;
  color: #c0c4cc;
  display: flex;
  align-items: center;
  gap: 6px;
}

.queue-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.4;
}

.queue-badge--main {
  background: #1d4073;
  color: #79b8ff;
}

.queue-badge--off {
  background: #1a4030;
  color: #7adf9b;
}

.queue-badge--armor {
  background: #503a10;
  color: #e6a23c;
}

.empty-queue {
  text-align: center;
  color: #606266;
  font-size: 12px;
  padding: 20px 0;
  border: 1px dashed #3a3d42;
  border-radius: 6px;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: #1e2127;
  border: 1px solid #3a3d42;
  border-radius: 6px;
  transition: background 0.2s;
}

.queue-item:hover {
  background: #23262b;
}

.queue-order {
  min-width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.queue-order--off {
  background: #67c23a;
}

.queue-order--armor {
  background: #e6a23c;
}

.queue-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.queue-name {
  font-size: 12px;
  font-weight: 600;
  color: #e0e0e0;
}

.queue-meta {
  font-size: 10px;
  color: #888888;
  margin-top: 1px;
}

.queue-actions {
  display: flex;
  gap: 4px;
}

/* 裝備選擇原生按鈕優化 */
.weapon-btn {
  background: transparent;
  border: 1px solid #3a3d42;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  height: 20px;
  line-height: 14px;
  cursor: pointer;
  box-sizing: border-box;
  font-family: inherit;
  transition: all 0.15s ease;
}

.weapon-btn-main {
  color: #409eff;
  border-color: rgba(64, 158, 255, 0.35);
  background-color: rgba(64, 158, 255, 0.08);
}

.weapon-btn-main:hover {
  background-color: rgba(64, 158, 255, 0.18);
  border-color: #409eff;
}

.weapon-btn-off {
  color: #67c23a;
  border-color: rgba(103, 194, 58, 0.35);
  background-color: rgba(103, 194, 58, 0.08);
}

.weapon-btn-off:hover {
  background-color: rgba(103, 194, 58, 0.18);
  border-color: #67c23a;
}

.weapon-btn-armor {
  color: #e6a23c;
  border-color: rgba(230, 162, 60, 0.35);
  background-color: rgba(230, 162, 60, 0.08);
}

.weapon-btn-armor:hover {
  background-color: rgba(230, 162, 60, 0.18);
  border-color: #e6a23c;
}
</style>
