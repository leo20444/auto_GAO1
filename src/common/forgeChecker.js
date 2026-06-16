import statusChecker from "./statusChecker";
import { ElMessage } from "element-plus";

class forgeChecker extends statusChecker {
  constructor(profile, setProfileInfo, user) {
    super(profile, setProfileInfo, user);
  }

  checkStatus = async () => {
    if (this.profile.actionStatus === "鍛造") {
      if (this.forgeTime() < -5) {
        let profile = await this.user.forgeComplete();
        if (profile) {
          this.profile = profile;
          await this.setProfileInfo(profile);
          ElMessage("鍛造完成");
        }
        return true;
      } else {
        ElMessage(`鍛造中！(耗時：${this.actionTime()})分，背景共存中`);
        return false;
      }
    }
    // 其他狀態不阻礙發起鍛造
    return true;
  };
}

export default forgeChecker;
