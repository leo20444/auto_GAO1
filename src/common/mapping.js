const map = [
  { name: "起始之鎮", id: 0 },
  { name: "大草原", id: 1 },
  { name: "草原秘徑", id: 1001 },
  { name: "猛牛園", id: 2 },
  { name: "被詛咒的寺院", id: 2001 },
  { name: "兒童樂園", id: 3 },
  { name: "蘑菇園", id: 4 },
  { name: "菇菇仙境", id: 4001 },
  { name: "圓明園", id: 5 },
  { name: "黃石國家公園", id: 6 },
  { name: "綠水管", id: 6001 },
];

// 秘徑設定對照表
export const secretRealmConfig = {
  1001: { parentId: 1, enterFloor: 16, parentName: "大草原" },
  2001: { parentId: 2, enterFloor: 18, parentName: "猛牛園" },
  4001: { parentId: 4, enterFloor: 12, parentName: "蘑菇園" },
  6001: { parentId: 6, enterFloor: 14, parentName: "黃石國家公園" },
};

export default map;
