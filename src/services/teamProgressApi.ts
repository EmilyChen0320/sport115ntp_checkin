import axios, { type AxiosInstance, isAxiosError } from "axios";
import type {
  AreaProgressView,
  EventProgressView,
  TeamProgressView,
  TeamMemberCheckInPointView,
  TeamMemberView,
} from "../types/teamProgress";

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

/** 後端常回傳數字型 team_id；需與字串一併支援，否則正規化後 teamId 為空會讓邀請按鈕永遠 disabled */
function pickIdLikeString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(Math.trunc(v));
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

function pickBoolean(...values: unknown[]): boolean {
  for (const v of values) {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v !== "string") continue;
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "yes" || s === "y") return true;
  }
  return false;
}

function normalizeAreaProgress(row: Record<string, unknown>): AreaProgressView {
  return {
    areaId: pickNumber(row.area_id, row.areaId, row.id),
    areaName: pickString(row.area_name, row.areaName) || "-",
    isCompleted: pickBoolean(row.is_completed, row.isCompleted, row.completed),
  };
}

function normalizeEventProgressRow(row: Record<string, unknown>): EventProgressView {
  const areasRaw = row.areas;
  const areasList = Array.isArray(areasRaw) ? areasRaw : [];
  const areas: AreaProgressView[] = areasList
    .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
    .map((a) => normalizeAreaProgress(a));

  const countedDone = areas.filter((a) => a.isCompleted).length;
  const totalFromApi = pickNumber(row.total_areas, row.totalAreas);
  const doneFromApi = pickNumber(row.completed_areas, row.completedAreas);

  return {
    eventId: pickNumber(row.event_id, row.eventId),
    eventName: pickString(row.event_name, row.eventName) || "",
    totalAreas: totalFromApi > 0 ? totalFromApi : areas.length,
    completedAreas: doneFromApi > 0 ? doneFromApi : countedDone,
    isCompleted: pickBoolean(row.is_completed, row.isCompleted),
    areas,
  };
}

function normalizeProgressList(raw: unknown): EventProgressView[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    .map((row) => normalizeEventProgressRow(row));
}

function normalizeMemberCheckInPoint(row: Record<string, unknown>): TeamMemberCheckInPointView {
  return {
    pointId: pickIdLikeString(row.point_id, row.pointId, row.id),
    name: pickString(row.name, row.point_name, row.pointName) || "-",
    location: pickString(row.location),
    address: pickString(row.address),
    checkedInAt: pickString(row.checked_in_at, row.checkedInAt, row.created_at, row.createdAt),
  };
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
  const checkInPointsRaw = row.check_in_points ?? row.checkInPoints ?? row.points;
  const checkInPointsList = Array.isArray(checkInPointsRaw) ? checkInPointsRaw : [];

  return {
    avatarUrl: pickString(row.avatar_url, row.avatarUrl, row.avatar, row.picture_url, row.pictureUrl) || fallbackAvatar,
    name: pickString(row.name, row.display_name, row.displayName, row.line_display_name) || "隊員",
    isCaptain: Boolean(
      row.is_captain ?? row.isCaptain ?? row.captain ?? row.is_leader ?? row.isLeader,
    ),
    checkInCount: pickNumber(row.check_in_count, row.checkInCount, row.check_in_times, row.checkInTimes),
    checkInPoints: checkInPointsList
      .filter((point): point is Record<string, unknown> => typeof point === "object" && point !== null)
      .map((point) => normalizeMemberCheckInPoint(point)),
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

  const teamId = pickIdLikeString(
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

  let taiwan22Completed = pickNumber(
    root.taiwan22_completed,
    root.taiwan22Completed,
    root.taiwan22_count,
    root.taiwan22Count,
    root.tw22_completed,
    root.tw22Completed,
    teamBlock.taiwan22_completed,
    teamBlock.taiwan22Completed,
  );

  let newTaipei29Completed = pickNumber(
    root.newtaipei29_completed,
    root.newTaipei29Completed,
    root.newTaipei29_completed,
    root.new_taipei_29_completed,
    root.ntp29_completed,
    root.ntp29Completed,
    teamBlock.newtaipei29_completed,
    teamBlock.newTaipei29Completed,
  );

  const progressRaw = root.progress ?? teamBlock.progress;
  const progress = normalizeProgressList(progressRaw);

  for (const ev of progress) {
    const n = ev.areas.length;
    const isTaiwan = ev.totalAreas === 22 || n === 22 || (/22|全臺|臺灣|台灣/.test(ev.eventName) && !/新北/.test(ev.eventName));
    const isNewTaipei = ev.totalAreas === 29 || n === 29 || /新北|29/.test(ev.eventName);
    if (isTaiwan) {
      taiwan22Completed = Math.min(22, ev.completedAreas > 0 ? ev.completedAreas : taiwan22Completed);
    }
    if (isNewTaipei) {
      newTaipei29Completed = Math.min(29, ev.completedAreas > 0 ? ev.completedAreas : newTaipei29Completed);
    }
  }

  const teamIconUrl = pickString(root.icon, teamBlock.icon, root.team_icon, teamBlock.team_icon);
  const memberCountFromApi = pickNumber(root.member_count, teamBlock.member_count);

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
    teamIconUrl: teamIconUrl || "",
    memberCountFromApi: memberCountFromApi > 0 ? memberCountFromApi : members.length,
    progress,
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
