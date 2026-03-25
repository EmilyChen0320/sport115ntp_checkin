import axios, { type AxiosInstance } from "axios";
import avatarFallback from "../assets/images/avatar.png";
import { getEndpointConfig } from "../config/endpoint";
import type { TeamProgressView } from "../types/teamProgress";
import { fetchTeamProgress as requestTeamProgress } from "./teamProgressApi";
import { createMockTeamProgress } from "./teamProgressMock";

const endpoint = getEndpointConfig();

export const apiClient: AxiosInstance = axios.create({
  baseURL: endpoint.baseURL,
  timeout: endpoint.timeout,
  headers: endpoint.authToken
    ? {
        Authorization: `Bearer ${endpoint.authToken}`,
      }
    : undefined,
});

export type { TeamMemberView, TeamProgressView } from "../types/teamProgress";

export interface CreateTeamPayload {
  name: string;
  leaderId: string;
  leaderName: string;
  leaderPhone: string;
  leaderEmail: string;
  /** 後端文件顯示必填，使用 multipart/form-data 上傳。 */
  icon: File;
}

/** GET /api/check-in/teams/progress?line_user_id=（useMockTeamApi 時改走假資料） */
export async function getTeamProgress(lineUserId: string): Promise<TeamProgressView | null> {
  const cfg = getEndpointConfig();
  if (cfg.useMockTeamApi) {
    return createMockTeamProgress(avatarFallback as string, lineUserId);
  }
  return requestTeamProgress(apiClient, lineUserId, avatarFallback as string);
}

/** POST /api/check-in/teams */
export async function createTeam(payload: CreateTeamPayload): Promise<unknown> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("leader_id", payload.leaderId);
  formData.append("leader_name", payload.leaderName);
  formData.append("leader_phone", payload.leaderPhone);
  formData.append("leader_email", payload.leaderEmail);
  formData.append("icon", payload.icon);

  const { data } = await apiClient.post("/api/check-in/teams", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
