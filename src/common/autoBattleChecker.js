import map from "../common/mapping";
import specialMap from "../common/specialMap";
import { ElMessage } from "element-plus";
import sleep from "./sleep";

class autoBattleChecker {
  constructor(
    profile,
    user,
    setProfileInfo,
    setting,
    weaponCheckTag,
    myWeaponChecker,
    medicineCheckTag,
    medicineSetting,
    allAccounts
  ) {
    this.profile = profile;
    this.user = user;
    this.setProfileInfo = setProfileInfo;
    this.setting = setting;
    this.weaponCheckTag = weaponCheckTag;
    this.myWeaponChecker = myWeaponChecker;
    this.medicineCheckTag = medicineCheckTag;
    this.medicineSetting = medicineSetting;
    this.allAccounts = allAccounts;
  }

  safeMove = async (mapId) => {
    let moveRes = await this.user.move(mapId);

    const isConflict =
      moveRes?.error &&
      (moveRes.status === 409 ||
        (moveRes.message && moveRes.message.includes("409")));

    if (isConflict) {
      ElMessage("移動衝突 (409)，嘗試確認落地...");

      const arriveRes = await this.user.moveComplete();

      if (arriveRes && !arriveRes.error) {
        this.setProfileInfo(arriveRes);
        this.profile = arriveRes;

        // arrive 後確認是否已在目標地圖，若是則不再發 move（避免二次 409）
        const targetMap = map.find((item) => item.id === mapId);
        const alreadyThere =
          mapId === 0
            ? arriveRes.zoneName === "起始之鎮"
            : targetMap && arriveRes.zoneName === targetMap.name;

        if (alreadyThere) {
          moveRes = arriveRes;
        } else {
          // 給伺服器短暫緩衝後重新發 move
          await sleep(500);
          moveRes = await this.user.move(mapId);
          if (moveRes && !moveRes.error) {
            this.setProfileInfo(moveRes);
            this.profile = moveRes;
          }
        }
      }
    } else {
      if (moveRes && !moveRes.error) {
        this.setProfileInfo(moveRes);
        this.profile = moveRes;
      }
    }
    return moveRes;
  };

  checkSetting = async () => {
    try {
      console.log("checkSetting");
      if (this.profile.hp <= 0) {
        if (this.profile.zoneName === "起始之鎮") {
          ElMessage("偵測到死亡回城，等待 3 秒後直接出發前往目標地圖...");
          await sleep(3000);
          await this.safeMove(getMapIdByName(this.setting.map));
          return false;
        }
        // 死亡不用休息，繞過 HP/SP 檢查，但仍需確保在地圖上
        if (!(await this.checkMap())) return false;
        if (!this.weaponCheckTag) return true;
        if (!(await this.myWeaponChecker.checkEquipment())) return false;
        return true;
      }
      if (!(await this.checkHpSp())) return false;
      if (!(await this.checkMap())) return false;
      if (!this.weaponCheckTag) return true;
      if (!(await this.myWeaponChecker.checkEquipment())) return false;

      return true;
    } catch (error) {
      console.log(error);
      if (error === "CRITICAL_STOP_NO_WEAPON") {
        throw error;
      }
      return false;
    }
  };

  checkHpSp = async () => {
    const hpMode = this.setting.hpRecoveryMode || "rest";
    const spMode = this.setting.spRecoveryMode || "rest";

    console.log(
      `[HP/SP 檢查] ${this.profile.name} - 當前 HP: ${this.profile.hp}/${this.profile.fullHp} (設定門檻: ${this.setting.hp}), SP: ${this.profile.sp}/${this.profile.fullSp} (設定門檻: ${this.setting.sp})`
    );

    // 1. 檢查 HP (如果已經 100% 滿則不觸發休息，避免設定大於上限造成的無限休息死循環)
    if (
      this.profile.hp < this.profile.fullHp &&
      this.profile.hp <= this.setting.hp
    ) {
      if (hpMode === "medicine") {
        ElMessage("HP 低於設定，嘗試吃藥...");
        const eatSuccess = await this.eatMedicine(
          this.medicineSetting.medicineHpId,
          this.medicineSetting.medicineHpQuantity
        );
        if (eatSuccess && this.profile.hp > this.setting.hp) {
          ElMessage("HP 吃藥成功補滿至門檻以上。");
        } else {
          ElMessage("HP 補品不足或補不滿，自動降級為休息！");
          await this.rest();
          return false;
        }
      } else {
        ElMessage("HP 低於門檻，自動休息！");
        await this.rest();
        return false;
      }
    }

    // 2. 檢查 SP (如果已經 100% 滿則不觸發休息，避免設定大於上限造成的無限休息死循環)
    if (
      this.profile.sp < this.profile.fullSp &&
      this.profile.sp <= this.setting.sp
    ) {
      if (spMode === "medicine") {
        ElMessage("SP 低於設定，嘗試吃藥...");
        const eatSuccess = await this.eatMedicine(
          this.medicineSetting.medicineSpId,
          this.medicineSetting.medicineSpQuantity
        );
        if (eatSuccess && this.profile.sp > this.setting.sp) {
          ElMessage("SP 吃藥成功補滿至門檻以上。");
        } else {
          ElMessage("SP 補品不足或補不滿，自動降級為休息！");
          await this.rest();
          return false;
        }
      } else {
        ElMessage("SP 低於門檻，自動休息！");
        await this.rest();
        return false;
      }
    }

    return true;
  };

  checkMap = async () => {
    if (this.setting.map === "") {
      ElMessage("請選地圖！");
      return false;
    }

    // 1. 如果角色當前在「起始之鎮」
    if (this.profile.zoneName === "起始之鎮") {
      const targetPercent = this.setting?.autoRest
        ? Number(this.setting.autoRestPercent ?? 90)
        : 100;
      const hpPercent = (this.profile.hp / this.profile.fullHp) * 100;
      const mpPercent = (this.profile.sp / this.profile.fullSp) * 100;

      const isHpAboveThreshold = this.profile.hp > (this.setting.hp || 0);
      const isSpAboveThreshold = this.profile.sp > (this.setting.sp || 0);

      // 檢查是否需要休息（血量或魔量未達標，或低於保護門檻）
      if (
        hpPercent < targetPercent ||
        mpPercent < targetPercent ||
        !isHpAboveThreshold ||
        !isSpAboveThreshold
      ) {
        ElMessage(`回城休息中，補滿狀態至門檻 (${targetPercent}%)...`);
        await this.rest(); // 發起休息
        return false; // 等待休息完成
      }
    }

    // 2. 判斷是否到秘境
    if (
      specialMap.includes(this.setting.map) &&
      this.profile.zoneName != this.setting.map
    ) {
      if (await this.checkSpecialMap()) {
        return true;
      } else {
        return false;
      }
    }

    // 3. 移動到目標地圖
    if (this.profile.zoneName !== this.setting.map) {
      const pMode = this.setting.partyMode;
      if (
        this.profile.zoneName === "起始之鎮" &&
        pMode &&
        pMode.enabled &&
        !pMode.ignoreMemberStatus
      ) {
        if (this.allAccounts) {
          if (!pMode.isLeader) {
            // 隊員端：等待隊長出發
            const leaderAcc = this.allAccounts.find((a) => {
              const aParty = a.automation?.battle?.setting?.partyMode;
              return (
                aParty &&
                aParty.enabled &&
                aParty.isLeader &&
                a.automation.battle.setting.map === this.setting.map
              );
            });
            if (leaderAcc) {
              const isLeaderInTown = leaderAcc.profile.zoneName === "起始之鎮";
              const isLeaderMoving = leaderAcc.profile.actionStatus === "移動";
              if (isLeaderInTown && !isLeaderMoving) {
                ElMessage("組隊同步：等待隊長出發...");
                return false;
              }
            }
          } else {
            // 隊長端：等待所有我方託管成員在起始之鎮就緒
            const partyStatus = await this.user.getPartyStatus();
            if (partyStatus && partyStatus.party && partyStatus.party.members) {
              const members = partyStatus.party.members;
              let allReady = true;

              for (const member of members) {
                // 排除隊長自己
                if (
                  Number(member.user_id) === Number(this.profile.id) ||
                  Number(member.user_id) === Number(this.profile.userId) ||
                  Number(member.user_id) === Number(this.profile.user_id)
                ) {
                  continue;
                }

                // 尋找我方託管組員
                const memberAcc = this.allAccounts.find(
                  (a) =>
                    (a.profile.id &&
                      Number(a.profile.id) === Number(member.user_id)) ||
                    (a.profile.userId &&
                      Number(a.profile.userId) === Number(member.user_id)) ||
                    (a.profile.user_id &&
                      Number(a.profile.user_id) === Number(member.user_id))
                );

                if (memberAcc) {
                  // 1. 必須回到起始之鎮
                  if (memberAcc.profile.zoneName !== "起始之鎮") {
                    allReady = false;
                    console.log(
                      `[隊長等待] 隊友 ${member.character_name} 尚未回到起始之鎮`
                    );
                    break;
                  }

                  // 2. 必須不忙碌 (排除重生、移動、鍛造，允許空閒、休息)
                  const isBusy =
                    memberAcc.profile.actionStatus !== "空閒" &&
                    memberAcc.profile.actionStatus !== "休息" &&
                    memberAcc.profile.actionStatus !== "戰鬥";
                  if (isBusy) {
                    allReady = false;
                    console.log(
                      `[隊長等待] 隊友 ${member.character_name} 忙碌中 (${memberAcc.profile.actionStatus})`
                    );
                    break;
                  }

                  // 3. HP / SP 必須滿足
                  const mSetting = memberAcc.automation.battle.setting;
                  const hpLimit = mSetting.hp || 100;
                  const spLimit = mSetting.sp || 150;
                  const isHpOk =
                    member.hp >= member.max_hp || member.hp > hpLimit;
                  const isSpOk =
                    member.mp >= member.max_mp || member.mp > spLimit;
                  if (!isHpOk || !isSpOk) {
                    allReady = false;
                    console.log(
                      `[隊長等待] 隊友 ${member.character_name} 狀態不滿足 (HP: ${member.hp}/${member.max_hp}, SP: ${member.mp}/${member.max_mp})`
                    );
                    break;
                  }

                  // 4. 武器耐久必須就緒
                  const minDur = pMode.minDurability || 10;
                  const memberEquips = memberAcc.items.equipments || [];
                  const equippedWeapons = memberEquips.filter(
                    (w) => w.status === "已裝備"
                  );
                  const weaponTypes = [
                    "短刀",
                    "單手劍",
                    "細劍",
                    "單手錘",
                    "盾牌",
                    "雙手斧",
                    "雙手劍",
                    "太刀",
                    "長槍",
                  ];
                  const equippedWeapon = equippedWeapons.find((w) =>
                    weaponTypes.includes(w.typeName)
                  );
                  if (equippedWeapon) {
                    if (equippedWeapon.durability < minDur) {
                      allReady = false;
                      console.log(
                        `[隊長等待] 隊友 ${member.character_name} 武器耐久低於門檻 (${equippedWeapon.durability} < ${minDur})`
                      );
                      break;
                    }
                  } else {
                    if (!pMode.allowEmptyHanded) {
                      allReady = false;
                      console.log(
                        `[隊長等待] 隊友 ${member.character_name} 空手且不允許空手`
                      );
                      break;
                    }
                  }
                }
              }

              if (!allReady) {
                ElMessage("組隊同步：等待隊友回村重整...");
                return false;
              }
            }
          }
        }
      }

      ElMessage("地圖不對，前往目標地圖！");
      await this.safeMove(getMapIdByName(this.setting.map));
      ElMessage("移動！");
      return false;
    }

    // 4. 層數上限檢查
    // 只有在 setting.mapLevel 大於 0 的時候才進行層數上限檢查，若為 0 則代表無上限
    if (
      this.setting.mapLevel > 0 &&
      this.profile.huntStage >= this.setting.mapLevel
    ) {
      ElMessage(
        `已達到目標層數 (${this.profile.huntStage}F >= ${this.setting.mapLevel}F)，正在回城休息...`
      );
      await this.safeMove(0); // 移回起始之鎮 (0)
      ElMessage("回城！");
      return false;
    }

    return true;
  };

  checkSpecialMap = async () => {
    switch (this.setting.map) {
      case "草原秘徑":
        //還沒到秘境
        if (this.profile.zoneName == "大草原") {
          if (Number(this.profile.huntStage) == 16) {
            let profile = await this.user.path(
              getMapIdByName(this.setting.map)
            );
            this.setProfileInfo(profile);
            ElMessage("進入秘境！");
            return true;
          } else if (Number(this.profile.huntStage) > 16) {
            ElMessage("層數超過！");
            await this.safeMove(0);
            ElMessage("回城！");
          }
          return true;
        } else {
          ElMessage("地圖不對！");
          await this.safeMove(getMapIdByName("大草原"));
          ElMessage("移動！");

          return false;
        }

      case "被詛咒的寺院":
        //還沒到秘境
        if (this.profile.zoneName == "猛牛原") {
          if (Number(this.profile.huntStage) == 18) {
            let profile = await this.user.path(
              getMapIdByName(this.setting.map)
            );
            this.setProfileInfo(profile);
            ElMessage("進入秘境！");
            return true;
          } else if (Number(this.profile.huntStage) > 18) {
            ElMessage("層數超過！");
            await this.safeMove(0);
            ElMessage("回城！");
          }
          return true;
        } else {
          ElMessage("地圖不對！");
          await this.safeMove(getMapIdByName("猛牛原"));
          ElMessage("移動！");

          return false;
        }

      default:
        return false;
    }
  };

  rest = async () => {
    ElMessage("開始休息！");
    this.setProfileInfo(await this.user.rest());
  };

  eatMedicine = async (medicineId, medicineQuantity) => {
    if (!medicineId) {
      ElMessage("沒補品！");
      return false;
    }
    const qty = Math.max(1, Number(medicineQuantity) || 1);
    ElMessage(`開始吃補品 (預計吃 ${qty} 個)...`);

    let latestProfile = null;

    for (let i = 0; i < qty; i++) {
      if (qty > 1) {
        ElMessage(`使用補品中 (${i + 1}/${qty})...`);
      } else {
        ElMessage("使用補品中...");
      }

      let res = await this.user.eatMedicine(medicineId);
      if (res && res.profile) {
        latestProfile = res.profile;
        this.setProfileInfo(res.profile);
        this.profile = res.profile;
      } else {
        ElMessage("補品不足或使用失敗！");
        break;
      }

      // 吃完一個後，延遲 800 毫秒以防太頻繁發起 API 導致 429 限制
      if (i < qty - 1) {
        await sleep(800);
      }
    }

    return latestProfile ? true : false;
  };
}

function getMapIdByName(name) {
  const found = map.find((item) => item.name === name);
  return found ? found.id : null;
}

export default autoBattleChecker;
