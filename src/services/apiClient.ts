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

export interface CheckInAreaPointView {
  pointId: number;
  city: string;
  district: string;
  storeName: string;
  address: string;
  location: string;
}

type CheckInAreaResult = {
  id?: unknown;
  name?: unknown;
  points?: unknown;
};

function pickString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function parseDistrictFromAddress(address: string): string {
  const s = address.trim();
  if (!s) return "-";
  const m = s.match(/([^\s縣市]{1,6}(?:區|鄉|鎮|市))/);
  return m?.[1] ?? "-";
}

function normalizeAreaPoints(result: unknown): CheckInAreaPointView[] {
  const areaList = Array.isArray(result) ? result : result ? [result] : [];
  const rows: CheckInAreaPointView[] = [];

  for (const area of areaList) {
    const areaObj = (area ?? {}) as CheckInAreaResult;
    const city = pickString(areaObj.name);
    const points = Array.isArray(areaObj.points) ? areaObj.points : [];
    for (const point of points) {
      const p = (point ?? {}) as Record<string, unknown>;
      const address = pickString(p.address);
      rows.push({
        pointId: Number(p.id ?? 0) || 0,
        city,
        district: parseDistrictFromAddress(address),
        storeName: pickString(p.name),
        address,
        location: pickString(p.location),
      });
    }
  }

  return rows;
}

/** GET /api/check-in/areas?filter[name]= */
export async function getCheckInAreas(filterName?: string): Promise<CheckInAreaPointView[]> {
  const filter = filterName?.trim() ?? "";
  const params = filter ? { "filter[name]": filter } : undefined;
  const { data } = await apiClient.get("/api/check-in/areas", { params });
  return normalizeAreaPoints((data as { result?: unknown })?.result);
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

export interface JoinTeamPayload {
  team_id: string;
  line_user_id: string;
}

/** POST /api/check-in/teams/join */
export async function joinTeam(payload: JoinTeamPayload): Promise<unknown> {
  const { data } = await apiClient.post("/api/check-in/teams/join", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}
