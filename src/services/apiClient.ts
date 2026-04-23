import axios, { type AxiosInstance } from "axios";
import avatarFallback from "../assets/images/avatar.png";
import { getEndpointConfig } from "../config/endpoint";
import type { EventAreaStatView, EventStatView, TeamProgressView } from "../types/teamProgress";
import { fetchTeamProgress as requestTeamProgress } from "./teamProgressApi";
import { createMockEventsProgress, createMockTeamProgress } from "./teamProgressMock";

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

export type { EventAreaStatView, EventStatView, TeamMemberView, TeamProgressView } from "../types/teamProgress";

function unwrapApiArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.result)) return o.result;
    if (Array.isArray(o.data)) return o.data;
  }
  return [];
}

function normalizeEventAreaStat(row: Record<string, unknown>): EventAreaStatView {
  return {
    areaId: pickNumber(row.area_id ?? row.areaId),
    areaName: (typeof row.area_name === "string" ? row.area_name : typeof row.areaName === "string" ? row.areaName : "").trim() || "-",
    completedTeams: pickNumber(row.completed_teams ?? row.completedTeams),
  };
}

function normalizeEventStat(row: Record<string, unknown>): EventStatView {
  const areasRaw = row.areas;
  const areasList = Array.isArray(areasRaw) ? areasRaw : [];
  const areas = areasList
    .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
    .map((a) => normalizeEventAreaStat(a));
  return {
    eventId: pickNumber(row.event_id ?? row.eventId),
    eventName:
      (typeof row.event_name === "string" ? row.event_name : typeof row.eventName === "string" ? row.eventName : "").trim() ||
      "",
    completedTeams: pickNumber(row.completed_teams ?? row.completedTeams),
    totalTeams: pickNumber(row.total_teams ?? row.totalTeams),
    areas,
  };
}

/** GET /api/check-in/events/progress */
export async function getEventsProgress(): Promise<EventStatView[]> {
  const cfg = getEndpointConfig();
  if (cfg.useMockTeamApi) {
    return createMockEventsProgress();
  }
  const { data } = await apiClient.get<unknown>("/api/check-in/events/progress");
  const raw = unwrapApiArray(data);
  return raw
    .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    .map((row) => normalizeEventStat(row));
}

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

export interface CheckInDetectPointView {
  pointId: string;
  name: string;
  location: string;
  address: string;
  imgUrl: string;
  alreadyCheckedByTeam: boolean;
  isTestPoint: boolean;
}

export interface SubmitCheckInPayload {
  lineUserId: string;
  checkInPointId: string | number;
  gpsLocation: string;
  checkInPicture: Blob;
  filename?: string;
}

type CheckInAreaResult = {
  id?: unknown;
  name?: unknown;
  points?: unknown;
};

function pickString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function pickNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : Number(v ?? 0) || 0;
}

function pickIdLikeString(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function pickBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v !== "string") return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
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

function normalizeDetectPoints(result: unknown): CheckInDetectPointView[] {
  const list = Array.isArray(result) ? result : result ? [result] : [];
  return list
    .map((raw) => {
      const row = (raw ?? {}) as Record<string, unknown>;
      return {
        pointId: pickIdLikeString(row.point_id ?? row.pointId ?? row.id),
        name: pickString(row.name),
        location: pickString(row.location),
        address: pickString(row.address),
        imgUrl: pickString(row.img_url ?? row.imgUrl ?? row.image_url ?? row.imageUrl),
        alreadyCheckedByTeam: pickBoolean(
          row.already_checked_by_team ?? row.is_checked_by_team ?? row.is_checked ?? row.checked,
        ),
        isTestPoint: pickBoolean(row.is_test ?? row.test_mode) || pickString(row.name).includes("測試"),
      };
    })
    .filter((row) => row.pointId.length > 0 && row.name.length > 0);
}

/** GET /api/check-in/areas?filter[name]= */
export async function getCheckInAreas(filterName?: string): Promise<CheckInAreaPointView[]> {
  const filter = filterName?.trim() ?? "";
  const params = filter ? { "filter[name]": filter } : undefined;
  const { data } = await apiClient.get("/api/check-in/areas", { params });
  return normalizeAreaPoints((data as { result?: unknown })?.result);
}

/** GET /api/check-in/detect?gps_location={lat,lng} */
export async function detectNearbyPoints(gpsLocation: string): Promise<CheckInDetectPointView[]> {
  const location = gpsLocation.trim();
  const params = location ? { gps_location: location } : undefined;
  const { data } = await apiClient.get("/api/check-in/detect", { params });
  return normalizeDetectPoints((data as { result?: unknown })?.result);
}

/** POST /api/check-in */
export async function submitCheckIn(payload: SubmitCheckInPayload): Promise<unknown> {
  const formData = new FormData();
  formData.append("line_user_id", payload.lineUserId);
  formData.append("check_in_point_id", String(payload.checkInPointId));
  formData.append("gps_location", payload.gpsLocation);
  formData.append("check_in_picture", payload.checkInPicture, payload.filename ?? "checkin.jpg");
  const { data } = await apiClient.post("/api/check-in", formData, {
    headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
  });
  return data;
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

export interface RecordInvitePayload {
  line_user_id: string;
  team_id: string;
  inviter_id: string;
}

/** POST /api/check-in/invite-record — 記錄邀請意圖，需在使用者可能被導離頁面前呼叫 */
export async function recordInvite(payload: RecordInvitePayload): Promise<unknown> {
  const { data } = await apiClient.post("/api/check-in/invite-record", payload, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });
  return data;
}
