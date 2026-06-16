import { ElMessage } from "element-plus";
import typeList from "./typeList";
class weaponChecker {
  constructor(
    setting,
    weaponList,
    selectWeaponList,
    selectWeapons,
    checkWeaponTag,
    checkArmorTag,
    user
  ) {
    this.setting = setting;
    this.weaponList = weaponList;
    this.selectWeaponList = selectWeaponList;
    this.selectWeapons = selectWeapons;
    this.checkWeaponTag = checkWeaponTag;
    this.checkArmorTag = checkArmorTag;
    this.user = user;
    this.equipmentCanBeSelect = [];
    this.sortedEquipmentCanBeSelect = {};
  }

  checkEquipment = async () => {
    try {
      let equipped = await this.getEquippedWeapon();
      //把裝備中的裝備從待選清單去除
      this.equipmentCanBeSelect = this.getEquipmentCanBeSelect(equipped);
      //分類裝備為武器防具
      let sortedEquipment = await this.sortWeaponsAndArmors(equipped);
      this.sortedEquipmentCanBeSelect = await this.sortWeaponsAndArmors(
        this.equipmentCanBeSelect
      );
      if (this.checkWeaponTag)
        if (!(await this.checkWeapon(sortedEquipment.weapon))) return false;

      if (this.checkArmorTag)
        if (!(await this.checkArmor(sortedEquipment.armor))) return false;

      this.selectWeapons(
        this.sortedEquipmentCanBeSelect.weapon.concat(
          this.sortedEquipmentCanBeSelect.armor
        )
      );

      return true;
    } catch (error) {
      console.log(error);
      if (error === "CRITICAL_STOP_NO_WEAPON") {
        throw error;
      }
      return false;
    }
  };

  checkWeapon = async (sortedEquipment) => {
    // 如果沒裝備武器
    if (sortedEquipment.length === 0) {
      if (this.sortedEquipmentCanBeSelect.weapon.length === 0) {
        if (this.setting.allowEmptyHanded) {
          ElMessage("目前無裝備且無後備武器，空手戰鬥中...");
          return true; // 允許空手
        } else {
          ElMessage("未穿戴武器且無可用武器，停止戰鬥。");
          throw "CRITICAL_STOP_NO_WEAPON"; // 停止
        }
      }
      // 有後備武器，穿上
      await this.wearWeapon();
      return true;
    }

    // 有裝備武器，檢查耐久度
    const currentWeapon = sortedEquipment[0];
    if (currentWeapon.durability < this.setting.weaponDuration) {
      ElMessage(
        `目前武器 ${currentWeapon.name} 耐久低於門檻 (${currentWeapon.durability} < ${this.setting.weaponDuration})，嘗試更換...`
      );

      // 脫下當前武器
      if (currentWeapon.id) {
        await this.unEquipped(currentWeapon.id);
      }

      if (this.sortedEquipmentCanBeSelect.weapon.length === 0) {
        if (this.setting.allowEmptyHanded) {
          ElMessage("無可用備用武器，空手繼續戰鬥...");
          return true; // 允許空手
        } else {
          ElMessage("武器損壞且無可用備用武器，停止戰鬥。");
          throw "CRITICAL_STOP_NO_WEAPON"; // 停止
        }
      }

      // 穿上新武器
      await this.wearWeapon();
    }

    return true;
  };

  wearWeapon = async () => {
    await this.wearEquipment(this.sortedEquipmentCanBeSelect.weapon[0].id);
    ElMessage(`穿上${this.sortedEquipmentCanBeSelect.weapon[0].name}`);
    // 穿上後從帶裝備移除
    this.sortedEquipmentCanBeSelect.weapon =
      this.sortedEquipmentCanBeSelect.weapon.slice(1);
  };

  checkArmor = async (sortedEquipment) => {
    if (sortedEquipment.length == 0) {
      if (
        !this.checkEmptyWeaponCanBeSelect(
          this.sortedEquipmentCanBeSelect.armor,
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
          this.sortedEquipmentCanBeSelect.armor
        ))
      ) {
        await this.wearArmor();
      }
    }

    return true;
  };

  wearArmor = async () => {
    await this.wearEquipment(this.sortedEquipmentCanBeSelect.armor[0].id);
    ElMessage(`穿上${this.sortedEquipmentCanBeSelect.armor[0].name}`);
    // 穿上後從帶裝備移除
    this.sortedEquipmentCanBeSelect.armor =
      this.sortedEquipmentCanBeSelect.armor.slice(1);
  };

  checkDurability = async (equipment, weaponCanBeSelect) => {
    if (!equipment || equipment.durability < this.setting.weaponDuration) {
      //武器沒壞掉的話脫裝備
      if (equipment && equipment.id) await this.unEquipped(equipment.id);

      ElMessage("換武器！");

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

  getEquipmentCanBeSelect = (equipped) => {
    // 選耐久夠的武器
    let equipmentCanBeSelect = this.selectWeaponList.filter((weapon) => {
      return (
        weapon.durability >= this.setting.weaponDuration &&
        !equipped.map((equip) => equip.id).includes(weapon.id)
      );
    });
    this.selectWeapons(equipmentCanBeSelect);

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
        const { id, name, typeName, durability, fullDurability } = weapon;
        return { id, name, typeName, durability, fullDurability };
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
