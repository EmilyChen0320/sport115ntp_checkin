import { createRouter, createWebHistory } from "vue-router";
import type { RouteLocationNormalized } from "vue-router";
import HomePage from "../views/HomePage.vue";
import CheckPlacePage from "../views/CheckPlacePage.vue";
import CheckEventPage from "../views/CheckEventPage.vue";
import CreateTeamPage from "../views/CreateTeamPage.vue";
import TeamDetailPage from "../views/TeamDetail.vue";
import TeamJoinPage from "../views/TeamJoinPage.vue";

function firstQueryValue(q: RouteLocationNormalized["query"][string]): string {
  if (typeof q === "string") return q;
  if (Array.isArray(q) && typeof q[0] === "string") return q[0];
  return "";
}

/**
 * 舊版 LIFF 連結 `https://liff.line.me/{id}?path=/team/join&…` 經 primary redirect 後，
 * 參數會落在 Endpoint URL 的 `liff.state`（見 LINE 文件）。
 * 若不解碼導頁，使用者會卡在首頁僅帶 query。
 * @see https://developers.line.biz/en/docs/liff/opening-liff-app/#create-a-primary-redirect-url
 */
function redirectFromLiffState(to: RouteLocationNormalized) {
  const raw = firstQueryValue(to.query["liff.state"]);
  if (!raw) return null;

  let inner: string;
  try {
    inner = decodeURIComponent(raw);
  } catch {
    return null;
  }
  /**
   * 相容兩種 liff.state 內容：
   * 1) ?path=/team/join&team_id=...&inviter_id=...
   * 2) /team/join?team_id=...&inviter_id=...
   */
  try {
    // 先處理新版：/team/join?team_id=...&inviter_id=...
    if (inner.startsWith("/")) {
      const [pathname, query = ""] = inner.split("?");
      const teamPath = pathname.trim();
      const sp = new URLSearchParams(query);
      const teamId = sp.get("team_id")?.trim() ?? "";
      const inviterId = sp.get("inviter_id")?.trim() ?? "";
      if ((teamPath === "/team/join" || teamPath.endsWith("/team/join")) && teamId && inviterId) {
        return {
          path: "/team/join",
          query: { team_id: teamId, inviter_id: inviterId },
          replace: true as const,
        };
      }
    }

    // 再處理舊版：?path=/team/join&team_id=...&inviter_id=...
    const qs = inner.startsWith("?") ? inner.slice(1) : inner;
    const sp = new URLSearchParams(qs);
    const pathRaw = sp.get("path");
    if (!pathRaw) return null;
    const path = pathRaw.startsWith("/") ? pathRaw : `/${pathRaw}`;
    const teamId = sp.get("team_id")?.trim() ?? "";
    const inviterId = sp.get("inviter_id")?.trim() ?? "";
    if ((path === "/team/join" || path.endsWith("/team/join")) && teamId && inviterId) {
      return {
        path: "/team/join",
        query: { team_id: teamId, inviter_id: inviterId },
        replace: true as const,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomePage,
    },
    {
      path: "/check-place",
      name: "checkPlace",
      component: CheckPlacePage,
    },
    {
      path: "/check-event",
      name: "checkEvent",
      component: CheckEventPage,
    },
    {
      path: "/create-team",
      name: "createTeam",
      component: CreateTeamPage,
    },
    {
      path: "/team",
      name: "teamDetail",
      component: TeamDetailPage,
    },
    {
      path: "/team/join",
      name: "teamJoin",
      component: TeamJoinPage,
      beforeEnter(to) {
        const tid =
          typeof to.query.team_id === "string"
            ? to.query.team_id.trim()
            : Array.isArray(to.query.team_id) && typeof to.query.team_id[0] === "string"
              ? to.query.team_id[0].trim()
              : "";
        const iid =
          typeof to.query.inviter_id === "string"
            ? to.query.inviter_id.trim()
            : Array.isArray(to.query.inviter_id) && typeof to.query.inviter_id[0] === "string"
              ? to.query.inviter_id[0].trim()
              : "";
        if (!tid || !iid) {
          return { name: "home" };
        }
        return true;
      },
    },
  ],
});

router.beforeEach((to) => {
  const fromState = redirectFromLiffState(to);
  if (fromState) return fromState;
  return true;
});
