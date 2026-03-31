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
const isRouting = ref(false);

async function safePush(to: { name: string; query?: Record<string, string> }) {
  if (isRouting.value || isCheckingTeam.value) return;
  isRouting.value = true;
  try {
    await router.push(to);
  } finally {
    window.setTimeout(() => {
      isRouting.value = false;
    }, 180);
  }
}

function routeForAfter(after: "checkin" | "progress") {
  return after === "checkin" ? { name: "checkIn" } : { name: "teamDetail" };
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
    void safePush({ name: "createTeam" });
    return;
  }
  if (action === "checkin") {
    void ensureTeamThen("checkin");
    return;
  }
  void ensureTeamThen("progress");
}

function onCheckPlaceClick() {
  void safePush({ name: "checkPlace" });
}

function onCheckEventClick() {
  void safePush({ name: "checkEvent" });
}

function goCreateTeamFromPopup() {
  showNoTeamPopup.value = false;
  void safePush({
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
  <main class="min-h-screen w-full bg-linear-to-b from-[#e4d1f8] to-white text-[#333333]">
    <section class="mx-auto w-full max-w-[393px]">
    <section class="relative px-4 pt-[max(16px,env(safe-area-inset-top))]">
      <img :src="heroImage" alt="傳聖火主視覺" class="block w-full h-auto" />
      <button
        type="button"
        aria-label="查看活動辦法"
        class="tap-feedback absolute right-4 top-[129px] block w-[152px] max-w-[48%] rounded-full disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        :disabled="isRouting || isCheckingTeam"
        @click="onCheckEventClick"
      >
        <img :src="checkEventImage" alt="查看活動辦法" class="block h-auto w-full" />
      </button>
      <button
        type="button"
        aria-label="查看可打卡地點"
        class="tap-feedback absolute right-5 bottom-2 block w-[160px] max-w-[49%] rounded-full disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        :disabled="isRouting || isCheckingTeam"
        @click="onCheckPlaceClick"
      >
        <img :src="checkPlaceImage" alt="查看可打卡地點" class="block h-auto w-full" />
      </button>
    </section>

    <section class="px-4 pt-[14px] pb-6">
      <button
        type="button"
        class="tap-feedback block w-full rounded-3xl disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        :disabled="isRouting || isCheckingTeam"
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
          class="tap-feedback block rounded-3xl disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
          :disabled="isRouting || isCheckingTeam"
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
          class="tap-feedback block rounded-3xl disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
          :disabled="isRouting || isCheckingTeam"
          @click="onActionClick('progress')"
        >
          <img
            :src="thirdActionImage"
            alt="查看打卡進度"
            class="block h-auto w-full"
          />
        </button>
      </div>
      <p v-if="isCheckingTeam" class="mt-3 text-center text-[12px] text-[#674598]">處理中，請稍候…</p>
    </section>
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
        class="tap-feedback absolute right-4 top-4 h-7 w-7 rounded-full text-[22px] leading-none text-[#777] hover:bg-[#f3f3f3]"
        :disabled="isRouting || isCheckingTeam"
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
          class="tap-feedback flex-1 rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] py-2.5 text-[16px] font-bold text-white disabled:opacity-55"
          :disabled="isRouting || isCheckingTeam"
          @click="goCreateTeamFromPopup"
        >
          立即組隊
        </button>
        <button
          type="button"
          class="tap-feedback flex-1 rounded-full bg-[#e0e0e0] py-2.5 text-[16px] font-bold text-[#7a7a7a] disabled:opacity-55"
          :disabled="isRouting || isCheckingTeam"
          @click="showNoTeamPopup = false"
        >
          稍後再說
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tap-feedback {
  transition: transform 120ms ease-out, opacity 120ms ease-out;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.tap-feedback:active {
  transform: scale(0.96);
  opacity: 0.72;
}
</style>
