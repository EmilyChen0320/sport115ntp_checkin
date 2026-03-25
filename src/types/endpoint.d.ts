export interface EndpointConfig {
  baseURL: string;
  uploadImageUrl: string;
  uploadImagePath: string;
  uploadStatusUrl: string;
  authToken: string;
  timeout: number;
  liffId: string;
  basicId: string;
  enableLiff: boolean;
  testUserId: string;
  debug: boolean;
  /** Flex Message 主視覺圖（須為 HTTPS 公開網址）；未設定時邀請分享會用 placeholder */
  shareFlexHeroImageUrl?: string;
  /** 為 true 時不呼叫遠端，GET progress 改回傳假資料（適合純前端 / 無 API 時預覽） */
  useMockTeamApi?: boolean;
}

declare global {
  interface Window {
    endpoint?: Partial<EndpointConfig>;
  }
}

export {};
