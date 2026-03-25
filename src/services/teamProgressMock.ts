import type { TeamProgressView } from "../types/teamProgress";

/** 無後端或純前端預覽用假資料（啟用 window.endpoint.useMockTeamApi） */
export function createMockTeamProgress(fallbackAvatarUrl: string, lineUserId: string): TeamProgressView {
  return {
    teamId: `mock-team-${lineUserId.slice(-6) || "local"}`,
    teamName: "火焰傳承隊（Mock）",
    createdDate: "2026/05/20",
    taiwan22Completed: 3,
    newTaipei29Completed: 5,
    members: [
      {
        avatarUrl: fallbackAvatarUrl,
        name: "王小明",
        isCaptain: true,
        checkInCount: 2,
      },
      {
        avatarUrl: fallbackAvatarUrl,
        name: "李曉華",
        isCaptain: false,
        checkInCount: 1,
      },
      {
        avatarUrl: fallbackAvatarUrl,
        name: "吳美麗",
        isCaptain: false,
        checkInCount: 0,
      },
    ],
  };
}
