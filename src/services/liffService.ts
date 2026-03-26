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
  private endpoint = getEndpointConfig();

  async init(): Promise<void> {
    if (this.initialized || !this.endpoint.enableLiff) {
      return;
    }

    if (!this.endpoint.liffId) {
      if (this.endpoint.debug && !this.liffIdMissingNotified) {
        this.liffIdMissingNotified = true;
        console.info(
          "[LIFF] 已啟用 LIFF 但未設定 liffId，將使用離線 fallback（請在 index.html 的 window.endpoint.liffId 填入正式 ID）",
        );
      }
      return;
    }

    await liff.init({ liffId: this.endpoint.liffId });
    this.initialized = true;
  }

  isLiffEnvironment(): boolean {
    return this.endpoint.enableLiff && liff.isInClient();
  }

  async ensureLogin(): Promise<void> {
    if (!this.endpoint.enableLiff) {
      return;
    }

    await this.init();
    if (!this.endpoint.liffId) {
      return;
    }

    if (!liff.isLoggedIn()) {
      liff.login();
    }
  }

  async getUserProfile(): Promise<LiffUserProfile> {
    if (!this.endpoint.enableLiff) {
      return { userId: this.endpoint.testUserId };
    }

    await this.init();

    if (!this.endpoint.liffId) {
      return { userId: this.endpoint.testUserId };
    }

    if (!liff.isLoggedIn()) {
      return { userId: this.endpoint.testUserId };
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
    const profile = await this.getUserProfile();
    return profile.userId || this.endpoint.testUserId;
  }

  /**
   * 邀請隊員（純文字）：在 LIFF 客戶端走 shareTargetPicker；本機開發或非 LIFF 環境改以 console 輸出文字（mock-share）。
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

  async inviteTeamMemberViaTextShareTargetPicker(options: {
    teamId: string;
    teamName: string;
    memberCount: number;
    maxMembers?: number;
    /** 邀請者（隊長）的 LINE user id */
    inviterId: string;
  }): Promise<void> {
    const endpoint = getEndpointConfig();
    if (endpoint.enableLiff && endpoint.liffId) {
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

    let canUseLiff = false;
    try {
      canUseLiff =
        endpoint.enableLiff &&
        this.initialized &&
        liff.isInClient() &&
        typeof liff.isApiAvailable === "function" &&
        liff.isApiAvailable("shareTargetPicker");
    } catch {
      canUseLiff = false;
    }

    if (!canUseLiff) {
      console.info("[LIFF mock shareTargetPicker] 非 LIFF 或未可用 shareTargetPicker，以下是將送出的文字：", {
        messageText,
        joinUrl,
      });
      return;
    }

    try {
      await liff.shareTargetPicker([{ type: "text", text: messageText } as any]);
    } catch (error) {
      if (endpoint.debug) {
        console.error("[LIFF shareTargetPicker:text]", error);
      }
      console.info("[LIFF mock shareTargetPicker] 分享失敗或取消，文字內容備份：", messageText, joinUrl);
    }
  }
}

export const liffService = new LiffService();
