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

export interface TeamProgressView {
  teamId: string;
  teamName: string;
  /** 顯示用，例如 2026/05/20 */
  createdDate: string;
  taiwan22Completed: number;
  newTaipei29Completed: number;
  members: TeamMemberView[];
}
