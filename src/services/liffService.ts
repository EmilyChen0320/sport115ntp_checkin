import liff from "@line/liff";
import { getEndpointConfig } from "../config/endpoint";

export interface LiffUserProfile {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

type WebShareResult = "shared" | "aborted" | "unavailable";

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
   * 邀請隊員（純文字）：LINE 內優先 shareTargetPicker。
   * 注意：呼叫端請勿在 click 內先 await 其他 API，否則 iOS 可能拒絕開啟分享介面。
   */
  inviteTeamMemberViaShareTargetPicker(options: {
    teamId: string;
    teamName: string;
    memberCount: number;
    maxMembers?: number;
    inviterId: string;
  }): void {
    this.inviteTeamMemberViaTextShareTargetPicker(options);
  }

  /**
   * 系統分享表（可選 LINE）。`text` 不可含網址，否則與 `url` 並列時會出現兩條相同連結。
   */
  private async tryWebShare(inviteLinesWithoutUrl: string, joinUrl: string): Promise<WebShareResult> {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return "unavailable";
    }
    if (!joinUrl.trim()) {
      return "unavailable";
    }
    try {
      await navigator.share({
        title: "加入隊伍邀請",
        text: `${inviteLinesWithoutUrl}\n請點選下方連結加入隊伍。`,
        url: joinUrl,
      });
      return "shared";
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      if (name === "AbortError") return "aborted";
      return "unavailable";
    }
  }

  private async fallbackCopyInviteText(messageText: string, joinUrl: string, debug: boolean): Promise<void> {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(messageText);
      }
    } catch {
      /* ignore */
    }
    const hint =
      (typeof navigator !== "undefined" && navigator.clipboard
        ? "已將邀請文字複製到剪貼簿，請貼到 LINE 傳給好友。\n\n"
        : "無法自動複製，請長按下方連結手動複製。\n\n") +
      (joinUrl ? `加入連結：\n${joinUrl}\n\n` : "") +
      "若仍無法分享：請至 LINE Developers 為此 LIFF 加上「share_message」等分享所需權限（Share Target Picker）。";
    if (typeof window !== "undefined") {
      window.alert(hint);
    }
    if (debug) {
      console.info("[LIFF] 邀請備份（fallback）", { messageText, joinUrl });
    }
  }

  /** 使用者關閉選人視窗或未送出時，LINE 常會 reject；不應再跳備援 alert */
  private isSharePickerClosedByUser(error: unknown): boolean {
    const o = error as { code?: string; message?: string };
    const code = String(o?.code ?? "").toUpperCase();
    if (code === "CANCEL" || code.includes("CANCEL")) return true;
    const msg = String(o?.message ?? (error instanceof Error ? error.message : error) ?? "").toLowerCase();
    return (
      msg.includes("cancel") ||
      msg.includes("canceled") ||
      msg.includes("cancelled") ||
      msg.includes("closed") ||
      msg.includes("user deny") ||
      msg.includes("popup closed")
    );
  }

  private async afterSharePickerFailed(
    inviteLinesOnly: string,
    messageText: string,
    joinUrl: string,
    debug: boolean,
    error: unknown,
  ): Promise<void> {
    if (debug) {
      console.error("[LIFF shareTargetPicker:text]", error);
    }
    if (this.isSharePickerClosedByUser(error)) {
      return;
    }

    const ws = await this.tryWebShare(inviteLinesOnly, joinUrl);
    if (ws === "shared" || ws === "aborted") {
      return;
    }

    await this.fallbackCopyInviteText(messageText, joinUrl, debug);
  }

  private async whenNoSharePicker(
    inviteLinesOnly: string,
    messageText: string,
    joinUrl: string,
    endpoint: ReturnType<typeof getEndpointConfig>,
    inLineClient: boolean,
  ): Promise<void> {
    console.info("[LIFF] 無法使用 shareTargetPicker，原因可能為未在 LINE 內開啟或 LIFF 尚未 init", {
      messageText,
      joinUrl,
      inLineClient,
      initialized: this.initialized,
    });

    const quietDev = import.meta.env.DEV && !inLineClient;
    if (quietDev) {
      return;
    }

    const ws = await this.tryWebShare(inviteLinesOnly, joinUrl);
    if (ws === "shared" || ws === "aborted") {
      return;
    }

    await this.fallbackCopyInviteText(messageText, joinUrl, endpoint.debug);
  }

  /**
   * 同步呼叫 shareTargetPicker（不 await init / 不 await 其他前置），以符合行動裝置 user gesture 限制。
   * App 載入時應已由 ensureLogin 完成 liff.init。
   */
  inviteTeamMemberViaTextShareTargetPicker(options: {
    teamId: string;
    teamName: string;
    memberCount: number;
    maxMembers?: number;
    inviterId: string;
  }): void {
    const endpoint = getEndpointConfig();

    const maxMembers = options.maxMembers ?? 5;
    const memberLabel = `目前人數：${options.memberCount}/${maxMembers}`;

    const liffId = endpoint.liffId?.trim() || "";
    const inviterEncoded = encodeURIComponent(options.inviterId);
    /**
     * LIFF 額外路徑須接在 liffId 後（path 片段），不可再用 ?path= 舊寫法，否則可能 404。
     * @see https://developers.line.biz/en/docs/liff/opening-liff-app/#create-a-primary-redirect-url
     * 例：https://liff.line.me/{liffId}/team/join?team_id=…&inviter_id=…
     */
    const joinUrl = liffId
      ? `https://liff.line.me/${liffId}/team/join?team_id=${encodeURIComponent(options.teamId)}&inviter_id=${inviterEncoded}`
      : "";

    /** 不含網址：給 Web Share 用，避免 text 與 url 重複顯示同一連結 */
    const inviteLinesOnly = `【${options.teamName}】邀請你加入隊伍\n${memberLabel}`;
    const messageText = joinUrl ? `${inviteLinesOnly}\n加入連結：${joinUrl}` : inviteLinesOnly;

    let inLineClient = false;
    try {
      inLineClient = Boolean(liff.isInClient());
    } catch {
      inLineClient = false;
    }

    const shouldTrySharePicker =
      endpoint.enableLiff && this.initialized && inLineClient && Boolean(liffId);

    if (!shouldTrySharePicker) {
      void this.whenNoSharePicker(inviteLinesOnly, messageText, joinUrl, endpoint, inLineClient);
      return;
    }

    try {
      const pickerPromise = liff.shareTargetPicker([{ type: "text", text: messageText } as any]);
      void pickerPromise.catch((error: unknown) =>
        this.afterSharePickerFailed(inviteLinesOnly, messageText, joinUrl, endpoint.debug, error),
      );
    } catch (error) {
      void this.afterSharePickerFailed(inviteLinesOnly, messageText, joinUrl, endpoint.debug, error);
    }
  }
}

export const liffService = new LiffService();
