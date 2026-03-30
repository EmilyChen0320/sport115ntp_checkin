/** 與 UI / store 一致的隊伍進度資料（已由 API 正規化） */
export interface TeamMemberCheckInPointView {
  pointId: string;
  name: string;
  location: string;
  address: string;
  checkedInAt: string;
}

export interface TeamMemberView {
  avatarUrl: string;
  name: string;
  isCaptain: boolean;
  checkInCount: number;
  checkInPoints: TeamMemberCheckInPointView[];
}

/** 隊伍路線進度（GET /api/check-in/teams/progress 的 progress[]） */
export interface AreaProgressView {
  areaId: number;
  areaName: string;
  isCompleted: boolean;
}

export interface EventProgressView {
  eventId: number;
  eventName: string;
  totalAreas: number;
  completedAreas: number;
  isCompleted: boolean;
  areas: AreaProgressView[];
}

/** 全活動統計（GET /api/check-in/events/progress） */
export interface EventAreaStatView {
  areaId: number;
  areaName: string;
  completedTeams: number;
}

export interface EventStatView {
  eventId: number;
  eventName: string;
  completedTeams: number;
  totalTeams: number;
  areas: EventAreaStatView[];
}

export interface TeamProgressView {
  teamId: string;
  teamName: string;
  /** 顯示用，例如 2026/05/20 */
  createdDate: string;
  taiwan22Completed: number;
  newTaipei29Completed: number;
  members: TeamMemberView[];
  /** 隊伍圖示 URL（後端 icon） */
  teamIconUrl: string;
  /** 後端 member_count；與 members.length 可能不同步時以前端 members 顯示為準 */
  memberCountFromApi: number;
  progress: EventProgressView[];
}
