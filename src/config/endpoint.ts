import type { EndpointConfig } from "../types/endpoint";

const defaultConfig: EndpointConfig = {
  baseURL: "",
  uploadImageUrl: "",
  uploadImagePath: "",
  uploadStatusUrl: "",
  authToken: "",
  timeout: 12000,
  liffId: "",
  basicId: "",
  enableLiff: true,
  testUserId: "U_TEST_USER_ID",
  debug: false,
  shareFlexHeroImageUrl: "",
  useMockTeamApi: false,
};

export function getEndpointConfig(): EndpointConfig {
  return {
    ...defaultConfig,
    ...(window.endpoint ?? {}),
  };
}
