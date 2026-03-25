import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../views/HomePage.vue";
import CheckPlacePage from "../views/CheckPlacePage.vue";
import CheckEventPage from "../views/CheckEventPage.vue";
import CreateTeamPage from "../views/CreateTeamPage.vue";
import TeamDetailPage from "../views/TeamDetail.vue";
import TeamJoinPage from "../views/TeamJoinPage.vue";

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
    },
  ],
});
