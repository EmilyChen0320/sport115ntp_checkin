import { defineStore } from "pinia";
import { getTeamProgress } from "../services/apiClient";
import type { TeamProgressView } from "../types/teamProgress";

export const useTeamStore = defineStore("team", {
  state: () => ({
    teamData: null as TeamProgressView | null,
    isLoading: false,
    lastError: null as string | null,
  }),
  actions: {
    async fetchTeamProgress(lineUserId: string) {
      this.isLoading = true;
      this.lastError = null;
      try {
        const data = await getTeamProgress(lineUserId);
        this.teamData = data;
      } catch (e) {
        this.lastError = e instanceof Error ? e.message : "載入隊伍資料失敗";
        if (import.meta.env.DEV) {
          console.error(e);
        }
        // 非 404 錯誤：保留既有 teamData，避免網路瞬断造成畫面被清空
      } finally {
        this.isLoading = false;
      }
    },

    clearTeam() {
      this.teamData = null;
      this.lastError = null;
    },
  },
});
