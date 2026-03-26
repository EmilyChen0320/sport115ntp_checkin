import liff from "@line/liff";
import { getEndpointConfig } from "../config/endpoint";

export interface LiffUserProfile {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

class LiffService {
  private initialized = false;
  private liffIdMissingNotified = false;

  async init(): Promise<void> {
    const cfg = getEndpointConfig();
    if (this.initialized || !cfg.enableLiff) {
      return;
    }

    const liffId = cfg.liffId?.trim() ?? "";
    if (!liffId) {
      if (cfg.debug && !this.liffIdMissingNotified) {
        this.liffIdMissingNotified = true;
        console.info(
          "[LIFF] 已啟用 LIFF 但未設定 liffId，將使用離線 fallback（請在 index.html 的 window.endpoint.liffId 填入正式 ID）",
        );
      }
      return;
    }

    await liff.init({ liffId });
    this.initialized = true;
  }

  isLiffEnvironment(): boolean {
    const cfg = getEndpointConfig();
    return cfg.enableLiff && liff.isInClient();
  }

  async ensureLogin(): Promise<void> {
    const cfg = getEndpointConfig();
    if (!cfg.enableLiff) {
      return;
    }

    await this.init();
    if (!(cfg.liffId?.trim() ?? "")) {
      return;
    }

    if (!liff.isLoggedIn()) {
      liff.login();
    }
  }

  async getUserProfile(): Promise<LiffUserProfile> {
    const cfg = getEndpointConfig();
    if (!cfg.enableLiff) {
      return { userId: cfg.testUserId };
    }

    await this.init();

    if (!(cfg.liffId?.trim() ?? "")) {
      return { userId: cfg.testUserId };
    }

    if (!liff.isLoggedIn()) {
      return { userId: cfg.testUserId };
    }

    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    };
  }

  async getUserId(): Promise<string> {
    const cfg = getEndpointConfig();
    const profile = await this.getUserProfile();
    return profile.userId || cfg.testUserId;
  }

  /**
   * 邀請隊員（純文字）：在 LINE 內建瀏覽器盡量走 shareTargetPicker；
   * 本機或非 LINE 環境改為複製文字並提示。
   */
  async inviteTeamMemberViaShareTargetPicker(options: {
    teamId: string;
    teamName: string;
    memberCount: number;
    maxMembers?: number;
    /** 邀請者（隊長）的 LINE user id，讓受邀者可透過 progress API 取得隊伍資訊 */
    inviterId: string;
  }): Promise<void> {
    await this.inviteTeamMemberViaTextShareTargetPicker(options);
  }

  private async fallbackCopyInviteText(messageText: string, joinUrl: string, debug: boolean): Promise<void> {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(messageText);
      }
    } catch {
      /* 略過，改以下方 alert 人工複製 */
    }
    const hint =
      (typeof navigator !== "undefined" && navigator.clipboard
        ? "已將邀請文字複製到剪貼簿，請貼到 LINE 傳給好友。\n\n"
        : "請手動複製控制台（Console）內顯示的邀請文字。\n\n") +
      (joinUrl ? `加入連結：\n${joinUrl}\n\n` : "") +
      "若在 LINE 內仍無法跳出「傳送給好友」，請至 LINE Developers 確認此 LIFF 可使用 Share Target Picker，並請勿用系統瀏覽器直接開網頁（需從 LINE 開啟 LIFF）。";
    if (typeof window !== "undefined") {
      window.alert(hint);
    }
    if (debug) {
      console.info("[LIFF] 邀請備份（fallback）", { messageText, joinUrl });
    }
  }

  async inviteTeamMemberViaTextShareTargetPicker(options: {
    teamId: string;
    teamName: string;
    memberCount: number;
    maxMembers?: number;
    /** 邀請者（隊長）的 LINE user id */
    inviterId: string;
  }): Promise<void> {
    const endpoint = getEndpointConfig();
    if (endpoint.enableLiff && (endpoint.liffId?.trim() ?? "")) {
      await this.init();
    }

    const maxMembers = options.maxMembers ?? 5;
    const memberLabel = `目前人數：${options.memberCount}/${maxMembers}`;

    const liffId = endpoint.liffId?.trim() || "";
    const inviterEncoded = encodeURIComponent(options.inviterId);
    const joinUrl = liffId
      ? `https://liff.line.me/${liffId}?path=/team/join&team_id=${encodeURIComponent(
          options.teamId,
        )}&inviter_id=${inviterEncoded}`
      : "";

    const messageText = `【${options.teamName}】邀請你加入隊伍\n${memberLabel}\n加入連結：${joinUrl}`;

    let inLineClient = false;
    try {
      inLineClient = Boolean(liff.isInClient());
    } catch {
      inLineClient = false;
    }

    /** 勿只靠 isApiAvailable：部分 LINE 版本會誤判 false，導致永遠不走 shareTargetPicker */
    const shouldTrySharePicker =
      endpoint.enableLiff && this.initialized && inLineClient && Boolean(liffId);

    if (!shouldTrySharePicker) {
      console.info("[LIFF mock shareTargetPicker] 非 LINE 內建瀏覽器或未初始化 LIFF，將送出的文字：", {
        messageText,
        joinUrl,
        inLineClient,
        initialized: this.initialized,
      });
      /** 本機 chrome 開發：不洗版 alert；正式站若用外開瀏覽器則提示複製 */
      const quietDev = import.meta.env.DEV && !inLineClient;
      if (!quietDev) {
        await this.fallbackCopyInviteText(messageText, joinUrl, endpoint.debug);
      }
      return;
    }

    try {
      await liff.shareTargetPicker([{ type: "text", text: messageText } as any]);
    } catch (error) {
      if (endpoint.debug) {
        console.error("[LIFF shareTargetPicker:text]", error);
      }
      console.info("[LIFF] shareTargetPicker 失敗或使用者取消，改為 fallback", { messageText, joinUrl });
      await this.fallbackCopyInviteText(messageText, joinUrl, endpoint.debug);
    }
  }
}

export const liffService = new LiffService();
