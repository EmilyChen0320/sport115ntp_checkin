import axios, { type AxiosInstance, isAxiosError } from "axios";
import type { TeamProgressView, TeamMemberView } from "../types/teamProgress";

/** 後端可能使用不同欄位名；此處容錯正規化 */
export type TeamProgressApiPayload = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

function pickNumber(...values: unknown[]): number {
  for (const v of values) {
    if (typeof v === "number" && !Number.isNaN(v)) return Math.max(0, Math.round(v));
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Math.max(0, Math.round(Number(v)));
    }
  }
  return 0;
}

function formatCreatedDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}/${m}/${day}`;
  }
  return raw.replace(/-/g, "/");
}

function unwrapPayloadRoot(payload: TeamProgressApiPayload): TeamProgressApiPayload {
  const first = asRecord(payload.data) ?? asRecord(payload.result) ?? asRecord(payload.response);
  if (!first) return payload;
  const second = asRecord(first.data) ?? asRecord(first.result) ?? asRecord(first.response);
  return second ?? first;
}

function normalizeMember(row: Record<string, unknown>, fallbackAvatar: string): TeamMemberView {
  return {
    avatarUrl: pickString(row.avatar_url, row.avatarUrl, row.avatar, row.picture_url, row.pictureUrl) || fallbackAvatar,
    name: pickString(row.name, row.display_name, row.displayName, row.line_display_name) || "隊員",
    isCaptain: Boolean(
      row.is_captain ?? row.isCaptain ?? row.captain ?? row.is_leader ?? row.isLeader,
    ),
    checkInCount: pickNumber(row.check_in_count, row.checkInCount, row.check_in_times, row.checkInTimes),
  };
}

export function normalizeTeamProgressPayload(payload: TeamProgressApiPayload, fallbackAvatar: string): TeamProgressView {
  const root = unwrapPayloadRoot(payload);
  const teamBlock =
    asRecord(root.team) ??
    asRecord(root.team_info) ??
    asRecord(root.teamInfo) ??
    asRecord(root.group) ??
    root;

  const teamId = pickString(
    teamBlock.team_id,
    teamBlock.teamId,
    teamBlock.id,
    teamBlock.group_id,
    payload.team_id,
    payload.teamId,
    root.team_id,
    root.teamId,
  );

  const teamName = pickString(
    teamBlock.team_name,
    teamBlock.teamName,
    teamBlock.team_title,
    teamBlock.title,
    teamBlock.name,
    payload.team_name,
    payload.teamName,
    payload.name,
    root.team_name,
    root.teamName,
    root.name,
  );

  const createdRaw = pickString(
    teamBlock.created_at,
    teamBlock.createdAt,
    teamBlock.created_date,
    teamBlock.createdDate,
    teamBlock.create_time,
    teamBlock.created_time,
    // 後端有時會改成「隊伍建立」專用欄位命名
    teamBlock.team_created_at,
    teamBlock.teamCreatedAt,
    teamBlock.team_createdAt,
    // 或者欄位直接在 root（例如回傳 result 物件即含 team_* 欄位）
    root.team_created_at,
    root.teamCreatedAt,
    root.team_createdAt,
    payload.created_at,
    payload.createdAt,
    root.created_at,
    root.createdAt,
    root.created_date,
    root.createdDate,
    root.create_time,
    root.created_time,
  );

  const taiwan22Completed = pickNumber(
    root.taiwan22_completed,
    root.taiwan22Completed,
    root.taiwan22_count,
    root.taiwan22Count,
    root.tw22_completed,
    root.tw22Completed,
    teamBlock.taiwan22_completed,
    teamBlock.taiwan22Completed,
  );

  const newTaipei29Completed = pickNumber(
    root.newtaipei29_completed,
    root.newTaipei29Completed,
    root.newTaipei29_completed,
    root.new_taipei_29_completed,
    root.ntp29_completed,
    root.ntp29Completed,
    teamBlock.newtaipei29_completed,
    teamBlock.newTaipei29Completed,
  );

  const membersRaw = root.members ?? teamBlock.members ?? root.team_members ?? teamBlock.team_members;
  const membersList = Array.isArray(membersRaw) ? membersRaw : [];

  const members: TeamMemberView[] = membersList
    .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
    .map((m) => normalizeMember(m, fallbackAvatar));

  return {
    teamId,
    teamName: teamName || "我的隊伍",
    createdDate: formatCreatedDate(createdRaw),
    taiwan22Completed: Math.min(taiwan22Completed, 22),
    newTaipei29Completed: Math.min(newTaipei29Completed, 29),
    members,
  };
}

export async function fetchTeamProgress(
  client: AxiosInstance,
  lineUserId: string,
  fallbackAvatarUrl: string,
): Promise<TeamProgressView | null> {
  try {
    const { data } = await client.get<TeamProgressApiPayload>("/api/check-in/teams/progress", {
      params: { line_user_id: lineUserId },
    });
    return normalizeTeamProgressPayload(data ?? {}, fallbackAvatarUrl);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      const ct = String(error.response.headers?.["content-type"] ?? "").toLowerCase();
      // 後端「此使用者尚無隊伍」多為 JSON 404；未設定 Vite proxy 時常拿到開發伺服器回傳的 text/html 404
      if (ct.includes("text/html")) {
        throw new Error(
          "無法連上後端：請求落在本機（非 JSON 404）。請確認 .env.development 已設定 VITE_API_PROXY_TARGET、已填 index.html 的 authToken，並重啟 npm run dev。",
        );
      }
      return null;
    }
    throw error;
  }
}
