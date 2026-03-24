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
  private endpoint = getEndpointConfig();

  async init(): Promise<void> {
    if (this.initialized || !this.endpoint.enableLiff) {
      return;
    }

    if (!this.endpoint.liffId) {
      if (this.endpoint.debug) {
        console.warn("LIFF is enabled but liffId is empty. Fallback mode will be used.");
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
}

export const liffService = new LiffService();
