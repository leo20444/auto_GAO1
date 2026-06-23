import { ElMessage } from "element-plus";
import typeList from "./typeList";

class weaponChecker {
  constructor(
    setting,
    weaponList,
    selectWeaponListMain,
    selectWeaponListOff,
    selectWeaponsMain,
    selectWeaponsOff,
    checkWeaponTag,
    checkArmorTag,
    user
  ) {
    this.setting = setting;
    this.weaponList = weaponList;
    this.selectWeaponListMain = selectWeaponListMain;
    this.selectWeaponListOff = selectWeaponListOff;
    this.selectWeaponsMain = selectWeaponsMain;
    this.selectWeaponsOff = selectWeaponsOff;
    this.checkWeaponTag = checkWeaponTag;
    this.checkArmorTag = checkArmorTag;
    this.user = user;
    this.equipmentCanBeSelectMain = [];
    this.equipmentCanBeSelectOff = [];
    this.sortedEquipmentCanBeSelectMain = {};
    this.sortedEquipmentCanBeSelectOff = {};
  }

  checkEquipment = async () => {
    try {
      let equipped = await this.getEquippedWeapon();

      // 把裝備中的裝備從待選清單去除
      this.equipmentCanBeSelectMain = this.getEquipmentCanBeSelect(
        equipped,
        this.selectWeaponListMain,
        this.selectWeaponsMain
      );
      this.equipmentCanBeSelectOff = this.getEquipmentCanBeSelect(
        equipped,
        this.selectWeaponListOff,
        this.selectWeaponsOff
      );

      // 分類裝備為武器防具
      let sortedEquipment = await this.sortWeaponsAndArmors(equipped);
      this.sortedEquipmentCanBeSelectMain = await this.sortWeaponsAndArmors(
        this.equipmentCanBeSelectMain
      );
      this.sortedEquipmentCanBeSelectOff = await this.sortWeaponsAndArmors(
        this.equipmentCanBeSelectOff
      );

      if (this.checkWeaponTag) {
        if (!(await this.checkWeapon(sortedEquipment.weapon))) return false;
      }

      if (this.checkArmorTag) {
        if (!(await this.checkArmor(sortedEquipment.armor))) return false;
      }

      // 把剩餘可選的武器寫回各自的 store 佇列中
      this.selectWeaponsMain(
        this.sortedEquipmentCanBeSelectMain.weapon.concat(
          this.sortedEquipmentCanBeSelectMain.armor
        )
      );
      this.selectWeaponsOff(this.sortedEquipmentCanBeSelectOff.weapon);

      return true;
    } catch (error) {
      console.log(error);
      if (error === "CRITICAL_STOP_NO_WEAPON") {
        throw error;
      }
      return false;
    }
  };

  checkWeapon = async (equippedWeapons) => {
    // 1. 檢查所有目前穿戴的武器耐久度
    const brokenWeapons = [];
    for (const w of equippedWeapons) {
      if (w.durability < this.setting.weaponDuration) {
        brokenWeapons.push(w);
      }
    }

    // 2. 脫下所有損壞的武器
    for (const w of brokenWeapons) {
      ElMessage(
        `目前武器 ${w.name} 耐久低於門檻 (${w.durability} < ${this.setting.weaponDuration})，嘗試更換...`
      );
      await this.unEquipped(w.id);
    }

    // 3. 取得目前最新已裝備的武器列表
    let currentEquipped = await this.getEquippedWeapon();
    let mainWeapon = currentEquipped.find((w) => w.slot === "main_hand");
    let offWeapon = currentEquipped.find((w) => w.slot === "off_hand");

    // 4. 主手武器更換/補足
    const isMainEmpty = !mainWeapon;
    if (isMainEmpty) {
      if (this.sortedEquipmentCanBeSelectMain.weapon.length > 0) {
        const nextMain = this.sortedEquipmentCanBeSelectMain.weapon[0];
        const isNextTwoHand = nextMain.hand_type === "two_hand";

        if (isNextTwoHand) {
          // 如果下一把是雙手武器，必須確保副手為空 (如果副手有武器，先脫下副手武器)
          if (offWeapon) {
            ElMessage("準備更換雙手武器，脫下當前副手裝備...");
            await this.unEquipped(offWeapon.id);
            offWeapon = null;
          }
        }

        // 穿上主手武器
        await this.wearEquipment(nextMain.id);
        ElMessage(`穿上主手: ${nextMain.name}`);
        this.sortedEquipmentCanBeSelectMain.weapon =
          this.sortedEquipmentCanBeSelectMain.weapon.slice(1);

        // 穿上後，重新取得最新裝備狀態
        currentEquipped = await this.getEquippedWeapon();
        mainWeapon = currentEquipped.find((w) => w.slot === "main_hand");
        offWeapon = currentEquipped.find((w) => w.slot === "off_hand");
      } else {
        // 主手無備用武器，且主手是空的
        if (!offWeapon) {
          // 連副手也是空的，代表完全空手
          if (this.setting.allowEmptyHanded) {
            ElMessage("目前無裝備且無後備武器，空手戰鬥中...");
            return true;
          } else {
            ElMessage("未穿戴武器且無可用武器，停止戰鬥。");
            throw "CRITICAL_STOP_NO_WEAPON";
          }
        }
      }
    }

    // 5. 副手武器更換/補足 (僅當啟用雙持、且主手不是雙手武器時)
    const isMainTwoHand = mainWeapon && mainWeapon.hand_type === "two_hand";
    if (this.setting.enableDualWield === true && !isMainTwoHand) {
      const isOffEmpty = !offWeapon;
      if (isOffEmpty) {
        if (this.sortedEquipmentCanBeSelectOff.weapon.length > 0) {
          const nextOff = this.sortedEquipmentCanBeSelectOff.weapon[0];
          // 副手只裝備單手武器/盾牌
          if (nextOff.hand_type !== "two_hand") {
            await this.wearEquipment(nextOff.id);
            ElMessage(`穿上副手: ${nextOff.name}`);
            this.sortedEquipmentCanBeSelectOff.weapon =
              this.sortedEquipmentCanBeSelectOff.weapon.slice(1);
          } else {
            // 萬一副手佇列被塞了雙手武器，跳過以防止異常
            console.warn("副手佇列不應放置雙手武器，已跳過:", nextOff.name);
            this.sortedEquipmentCanBeSelectOff.weapon =
              this.sortedEquipmentCanBeSelectOff.weapon.slice(1);
          }
        }
      }
    }

    return true;
  };

  checkArmor = async (sortedEquipment) => {
    if (sortedEquipment.length == 0) {
      if (
        !this.checkEmptyWeaponCanBeSelect(
          this.sortedEquipmentCanBeSelectMain.armor,
          "防具"
        )
      ) {
        return false;
      }
      await this.wearArmor();
    }

    for (let index = 0; index < sortedEquipment.length; index++) {
      const equipment = sortedEquipment[index];
      if (
        !(await this.checkDurability(
          equipment,
          this.sortedEquipmentCanBeSelectMain.armor
        ))
      ) {
        await this.wearArmor();
      }
    }

    return true;
  };

  wearArmor = async () => {
    await this.wearEquipment(this.sortedEquipmentCanBeSelectMain.armor[0].id);
    ElMessage(`穿上防具: ${this.sortedEquipmentCanBeSelectMain.armor[0].name}`);
    this.sortedEquipmentCanBeSelectMain.armor =
      this.sortedEquipmentCanBeSelectMain.armor.slice(1);
  };

  checkDurability = async (equipment, weaponCanBeSelect) => {
    if (!equipment || equipment.durability < this.setting.weaponDuration) {
      // 裝備沒壞掉的話脫裝備
      if (equipment && equipment.id) await this.unEquipped(equipment.id);

      ElMessage("換防具！");

      if (weaponCanBeSelect.length == 0) {
        ElMessage("沒裝備！");
        throw "沒裝備換";
      }

      return false;
    }

    return true;
  };

  checkEmptyWeaponCanBeSelect = (weaponCanBeSelect, typeName) => {
    if (weaponCanBeSelect.length == 0) {
      ElMessage(`沒${typeName}可以穿！`);
      return false;
    }
    return true;
  };

  getEquipmentCanBeSelect = (equipped, sourceQueue, callback) => {
    let equipmentCanBeSelect = sourceQueue.filter((weapon) => {
      return (
        weapon.durability >= this.setting.weaponDuration &&
        !equipped.map((equip) => equip.id).includes(weapon.id)
      );
    });
    callback(equipmentCanBeSelect);

    return equipmentCanBeSelect;
  };

  sortWeaponsAndArmors = async (equipped) => {
    let weaponList = equipped.filter((equip) =>
      typeList.weapon.includes(equip.typeName)
    );

    let armorList = equipped.filter(
      (equip) => !typeList.weapon.includes(equip.typeName)
    );

    return { weapon: weaponList, armor: armorList };
  };

  getEquippedWeapon = async () => {
    return this.weaponList
      .filter((weapon) => weapon.status == "已裝備")
      .map((weapon) => {
        const {
          id,
          name,
          typeName,
          durability,
          fullDurability,
          hand_type,
          slot,
        } = weapon;
        return {
          id,
          name,
          typeName,
          durability,
          fullDurability,
          hand_type,
          slot,
        };
      });
  };

  wearEquipment = async (id) => {
    this.weaponList = await this.user.equip(id);
  };

  unEquipped = async (id) => {
    this.weaponList = await this.user.unEquip(id);
  };
}

export default weaponChecker;
