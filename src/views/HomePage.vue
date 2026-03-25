<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { liffService } from "../services/liffService";
import { useTeamStore } from "../stores/teamStore";
import { storeToRefs } from "pinia";
import heroImage from "../assets/images/heroimage.png";
import checkPlaceImage from "../assets/images/checkplace.png";
import checkEventImage from "../assets/images/checkevent.png";
import firstActionImage from "../assets/images/join-team.png";
import secondActionImage from "../assets/images/team-checkin.png";
import thirdActionImage from "../assets/images/team-progress.png";
import homePopupImage from "../assets/images/homepagePopup.png";

const router = useRouter();
const route = useRoute();
const teamStore = useTeamStore();
const { teamData } = storeToRefs(teamStore);
const isCheckingTeam = ref(false);

function routeForAfter(after: "checkin" | "progress") {
  return after === "checkin" ? { name: "checkPlace" } : { name: "teamDetail" };
}

const showNoTeamPopup = ref(false);
const popupAfter = ref<"checkin" | "progress">("checkin");

async function ensureTeamThen(after: "checkin" | "progress") {
  if (isCheckingTeam.value) return;
  isCheckingTeam.value = true;
  try {
    const lineUserId = await liffService.getUserId();
    await teamStore.fetchTeamProgress(lineUserId);
    if (!teamData.value) {
      popupAfter.value = after;
      showNoTeamPopup.value = true;
      return;
    }
    router.push(routeForAfter(after));
  } finally {
    isCheckingTeam.value = false;
  }
}

function onActionClick(action: "team" | "checkin" | "progress") {
  if (action === "team") {
    router.push({ name: "createTeam" });
    return;
  }
  if (action === "checkin") {
    void ensureTeamThen("checkin");
    return;
  }
  void ensureTeamThen("progress");
}

function onCheckPlaceClick() {
  router.push({ name: "checkPlace" });
}

function onCheckEventClick() {
  router.push({ name: "checkEvent" });
}

function goCreateTeamFromPopup() {
  showNoTeamPopup.value = false;
  router.push({
    name: "createTeam",
    query: { after: popupAfter.value },
  });
}

onMounted(() => {
  // 方便你直接看 popup：/ ?forceNoTeamPopup=1&after=checkin|progress
  if (route.query.forceNoTeamPopup === "1") {
    popupAfter.value = route.query.after === "progress" ? "progress" : "checkin";
    showNoTeamPopup.value = true;
  }
});
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-linear-to-b from-[#e4d1f8] to-white text-[#333333]">
    <section class="relative px-4 pt-[max(8px,env(safe-area-inset-top))]">
      <img :src="heroImage" alt="傳聖火主視覺" class="block w-full h-auto" />
      <button
        type="button"
        aria-label="查看活動辦法"
        class="absolute right-8 top-[132px] block w-[160px] max-w-[49%] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        @click="onCheckEventClick"
      >
        <img :src="checkEventImage" alt="查看活動辦法" class="block h-auto w-full" />
      </button>
      <button
        type="button"
        aria-label="查看可打卡地點"
        class="absolute right-5 bottom-2 block w-[160px] max-w-[49%] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        @click="onCheckPlaceClick"
      >
        <img :src="checkPlaceImage" alt="查看可打卡地點" class="block h-auto w-full" />
      </button>
    </section>

    <section class="px-4 pt-[14px] pb-6">
      <button
        type="button"
        class="block w-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        @click="onActionClick('team')"
      >
        <img
          :src="firstActionImage"
          alt="立即組隊，開啟你的逐光旅程"
          class="block h-auto w-full"
        />
      </button>

      <div class="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          class="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
          @click="onActionClick('checkin')"
        >
          <img
            :src="secondActionImage"
            alt="聖火傳遞打卡"
            class="block h-auto w-full"
          />
        </button>

        <button
          type="button"
          class="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
          @click="onActionClick('progress')"
        >
          <img
            :src="thirdActionImage"
            alt="查看打卡進度"
            class="block h-auto w-full"
          />
        </button>
      </div>
    </section>
  </main>

  <!-- 未組隊提示彈窗（modal） -->
  <div
    v-if="showNoTeamPopup"
    class="fixed inset-0 z-50 flex items-center justify-center bg-[#00000066] px-4"
  >
    <div
      class="relative w-full max-w-[360px] rounded-[22px] bg-white px-6 pb-6 pt-10 shadow-[0_14px_40px_rgba(0,0,0,0.25)] ring-2 ring-[#d9d7ff]"
    >
      <button
        type="button"
        aria-label="關閉"
        class="absolute right-4 top-4 h-7 w-7 rounded-full text-[22px] leading-none text-[#777] hover:bg-[#f3f3f3]"
        @click="showNoTeamPopup = false"
      >
        ×
      </button>

      <h2 class="text-center text-[22px] font-extrabold leading-none text-[#222]">尚未組隊</h2>

      <p class="mt-4 text-center text-[13px] leading-6 text-[#666]">
        參加 LINE 聖火打卡活動需要先建立加入隊伍，且人數需滿 5 人即可開始打卡。
      </p>

      <div class="mt-5 ">
        <img :src="homePopupImage" alt="" class="mx-auto block w-full h-auto" />
      </div>

      <div class="mt-6 flex gap-4">
        <button
          type="button"
          class="flex-1 rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] py-2.5 text-[16px] font-bold text-white"
          @click="goCreateTeamFromPopup"
        >
          立即組隊
        </button>
        <button
          type="button"
          class="flex-1 rounded-full bg-[#e0e0e0] py-2.5 text-[16px] font-bold text-[#7a7a7a]"
          @click="showNoTeamPopup = false"
        >
          稍後再說
        </button>
      </div>
    </div>
  </div>
</template>
