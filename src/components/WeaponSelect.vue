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
          <el-checkbox v-model="checkWeapon" @change="updateCheckWeapon()">
            武器檢查
          </el-checkbox>
          <el-checkbox v-model="checkArmor" @change="updateCheckArmor()">
            防具檢查
          </el-checkbox>
        </el-space>
      </el-col>
    </el-row>

    <transition name="el-zoom-in-top" mode="out-in">
      <div v-show="equipmentCheck">
        <!-- 篩選區 -->
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
            <div class="input-label">選擇裝備（點擊按鈕加入主手/副手佇列）</div>
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

                <!-- 裝備分流按鈕 -->
                <span style="margin-left: 10px; display: inline-flex; gap: 4px">
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    style="
                      padding: 2px 6px;
                      font-size: 11px;
                      height: 20px;
                      line-height: 20px;
                    "
                    @click.stop="addToQueueMain(weapon)"
                  >
                    {{
                      typeList.armor.includes(weapon.typeName)
                        ? "+佇列"
                        : "+主手"
                    }}
                  </el-button>
                  <el-button
                    v-if="
                      enableDualWield &&
                      weapon.hand_type !== 'two_hand' &&
                      !typeList.armor.includes(weapon.typeName)
                    "
                    size="small"
                    type="success"
                    plain
                    style="
                      padding: 2px 6px;
                      font-size: 11px;
                      height: 20px;
                      line-height: 20px;
                    "
                    @click.stop="addToQueueOff(weapon)"
                  >
                    +副手
                  </el-button>
                </span>
              </div>
              <div v-if="filteredWeapons.length === 0" class="empty-pool">
                無符合的裝備
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 雙手佇列區 -->
        <el-row :gutter="20">
          <!-- 主手武器佇列 -->
          <el-col
            :xs="24"
            :sm="enableDualWield ? 12 : 24"
            style="margin-bottom: 15px"
          >
            <div class="queue-section">
              <div class="queue-header">
                <span class="queue-title">
                  主手與防具替換佇列（自動依序換裝）
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
                主手與防具尚未加入，點擊上方裝備 [+主手] 或 [+佇列] 加入
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
                      <template v-if="typeList.armor.includes(weapon.typeName)">
                        [防具 · {{ weapon.typeName }}]
                      </template>
                      <template v-else>
                        [{{
                          weapon.hand_type === "two_hand" ? "雙手" : "單手"
                        }}
                        · {{ weapon.typeName }}]
                      </template>
                      耐久: {{ weapon.durability }}/{{ weapon.fullDurability }}
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
            :xs="24"
            :sm="12"
            v-if="enableDualWield"
            style="margin-bottom: 15px"
          >
            <div class="queue-section">
              <div class="queue-header">
                <span class="queue-title">副手替換佇列（僅單手武器/盾牌）</span>
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
                副手尚未加入武器，點擊上方裝備 [+副手] 加入
              </div>

              <div v-else class="queue-list">
                <div
                  v-for="(weapon, idx) in selectedWeaponQueueOff"
                  :key="weapon.id"
                  class="queue-item"
                >
                  <span class="queue-order">{{ idx + 1 }}</span>
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
  weaponCheckTag: Boolean,
  armorCheckTag: Boolean,
  equipmentCheckTag: Boolean,
  enableDualWield: Boolean,
});

const emits = defineEmits([
  "equipment-check",
  "update-check-weapon",
  "update-check-armor",
  "update:selected-weapon-queue-main",
  "update:selected-weapon-queue-off",
]);

// 裝備管理開關
const equipmentCheck = ref(props.equipmentCheckTag ?? true);
const checkWeapon = ref(props.weaponCheckTag ?? true);
const checkArmor = ref(props.armorCheckTag ?? false);

const selectedWeaponQueueMain = ref<any[]>([]);
const selectedWeaponQueueOff = ref<any[]>([]);

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
    checkWeapon.value = v ?? true;
  }
);
watch(
  () => props.armorCheckTag,
  (v) => {
    checkArmor.value = v ?? false;
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

// 篩選後的可選武器（排除已在主手或副手佇列中的武器）
const filteredWeapons = computed(() => {
  const list: any[] = props.weaponList || [];
  const unselected = list.filter((w: any) => !isInQueue(w.id));
  if (!selectedType.value) return unselected;
  return unselected.filter((w: any) => w.typeName === selectedType.value);
});

// 判斷武器是否已在佇列中
const isInQueue = (id: any) =>
  selectedWeaponQueueMain.value.some((w) => w.id === id) ||
  selectedWeaponQueueOff.value.some((w) => w.id === id);

// 事件轉發與雙向綁定觸發
const emitMain = () => {
  emits("update:selected-weapon-queue-main", [
    ...selectedWeaponQueueMain.value,
  ]);
};

const emitOff = () => {
  emits("update:selected-weapon-queue-off", [...selectedWeaponQueueOff.value]);
};

// 加入主手佇列
const addToQueueMain = (weapon: any) => {
  const idx = selectedWeaponQueueMain.value.findIndex(
    (w) => w.id === weapon.id
  );
  if (idx !== -1) {
    selectedWeaponQueueMain.value.splice(idx, 1);
  } else {
    selectedWeaponQueueMain.value.push({ ...weapon });
  }
  emitMain();
};

// 加入副手佇列
const addToQueueOff = (weapon: any) => {
  const idx = selectedWeaponQueueOff.value.findIndex((w) => w.id === weapon.id);
  if (idx !== -1) {
    selectedWeaponQueueOff.value.splice(idx, 1);
  } else {
    selectedWeaponQueueOff.value.push({ ...weapon });
  }
  emitOff();
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

// 清空主手
const clearQueueMain = () => {
  selectedWeaponQueueMain.value = [];
  emitMain();
};

// 清空副手
const clearQueueOff = () => {
  selectedWeaponQueueOff.value = [];
  emitOff();
};

const handleEquipmentCheck = () => emits("equipment-check");
const updateCheckWeapon = () => emits("update-check-weapon");
const updateCheckArmor = () => emits("update-check-armor");
</script>

<style scoped>
.input-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  font-weight: 600;
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
</style>
