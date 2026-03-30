import type { EventStatView, TeamProgressView } from "../types/teamProgress";

/** 無後端或純前端預覽用假資料（啟用 window.endpoint.useMockTeamApi） */
export function createMockTeamProgress(fallbackAvatarUrl: string, lineUserId: string): TeamProgressView {
  return {
    teamId: `mock-team-${lineUserId.slice(-6) || "local"}`,
    teamName: "火焰傳承隊（Mock）",
    createdDate: "2026/05/20",
    taiwan22Completed: 5,
    newTaipei29Completed: 3,
    teamIconUrl: "",
    memberCountFromApi: 5,
    members: [
      {
        avatarUrl: fallbackAvatarUrl,
        name: "王小明",
        isCaptain: true,
        checkInCount: 2,
        checkInPoints: [],
      },
      {
        avatarUrl: fallbackAvatarUrl,
        name: "李曉華",
        isCaptain: false,
        checkInCount: 1,
        checkInPoints: [],
      },
      {
        avatarUrl: fallbackAvatarUrl,
        name: "吳美麗",
        isCaptain: false,
        checkInCount: 1,
        checkInPoints: [],
      },
      {
        avatarUrl: fallbackAvatarUrl,
        name: "劉大帥",
        isCaptain: false,
        checkInCount: 1,
        checkInPoints: [],
      },
      {
        avatarUrl: fallbackAvatarUrl,
        name: "張大衛",
        isCaptain: false,
        checkInCount: 0,
        checkInPoints: [],
      },
    ],
    progress: [
      {
        eventId: 1,
        eventName: "臺灣22縣市",
        totalAreas: 22,
        completedAreas: 5,
        isCompleted: true,
        areas: [
          { areaId: 1, areaName: "新北市", isCompleted: true },
          { areaId: 2, areaName: "臺中市", isCompleted: true },
          { areaId: 3, areaName: "嘉義市", isCompleted: true },
          { areaId: 4, areaName: "臺南市", isCompleted: true },
          { areaId: 5, areaName: "屏東縣", isCompleted: true },
          { areaId: 6, areaName: "臺北市", isCompleted: false },
          { areaId: 7, areaName: "桃園市", isCompleted: false },
        ],
      },
      {
        eventId: 2,
        eventName: "新北市29區",
        totalAreas: 29,
        completedAreas: 3,
        isCompleted: false,
        areas: [
          { areaId: 101, areaName: "板橋區", isCompleted: true },
          { areaId: 102, areaName: "三重區", isCompleted: true },
          { areaId: 103, areaName: "中和區", isCompleted: true },
        ],
      },
    ],
  };
}

export function createMockEventsProgress(): EventStatView[] {
  const taiwanAreas = [
    { areaId: 1, areaName: "臺北市", completedTeams: 1289 },
    { areaId: 2, areaName: "新北市", completedTeams: 78 },
    { areaId: 3, areaName: "桃園市", completedTeams: 62 },
    { areaId: 4, areaName: "臺中市", completedTeams: 53 },
    { areaId: 5, areaName: "臺南市", completedTeams: 45 },
    { areaId: 6, areaName: "高雄市", completedTeams: 38 },
  ];
  const ntAreas = [
    { areaId: 201, areaName: "板橋區", completedTeams: 45 },
    { areaId: 202, areaName: "中和區", completedTeams: 32 },
    { areaId: 203, areaName: "新莊區", completedTeams: 28 },
  ];
  return [
    {
      eventId: 1,
      eventName: "臺灣22縣市",
      completedTeams: 1180,
      totalTeams: 2000,
      areas: taiwanAreas,
    },
    {
      eventId: 2,
      eventName: "新北市29區",
      completedTeams: 156,
      totalTeams: 500,
      areas: ntAreas,
    },
  ];
}
