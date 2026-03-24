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
}

declare global {
  interface Window {
    endpoint?: Partial<EndpointConfig>;
  }
}

export {};
