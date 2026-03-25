<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { AxiosError } from "axios";
import { useRoute, useRouter } from "vue-router";
import { joinTeam } from "../services/apiClient";
import { liffService } from "../services/liffService";
import { useTeamStore } from "../stores/teamStore";
import { storeToRefs } from "pinia";
import joinTeamHero from "../assets/images/join-team.png";

const route = useRoute();
const router = useRouter();

const teamStore = useTeamStore();
const { teamData } = storeToRefs(teamStore);

const teamId = computed(() => {
  const q = route.query.team_id;
  return typeof q === "string" ? q : Array.isArray(q) ? q[0] ?? "" : "";
});

const isJoining = ref(false);
const joinError = ref("");
const isJoined = ref(false);
const agreeChecked = ref(false);

const MAX_MEMBERS = 5;

const isAlreadyInAnotherTeam = computed(() => joinError.value.includes("已加入其他隊伍"));

const members = computed(() => teamData.value?.members ?? []);
const teamName = computed(() => teamData.value?.teamName ?? "");
const createdDate = computed(() => teamData.value?.createdDate ?? "");
const leaderName = computed(() => {
  return members.value.find((m) => m.isCaptain)?.name ?? members.value[0]?.name ?? "";
});
const teamIconUrl = computed(() => {
  return (
    members.value.find((m) => m.isCaptain)?.avatarUrl ??
    members.value[0]?.avatarUrl ??
    ""
  );
});
const inviterName = computed(() => leaderName.value || "朋友");

async function joinTeamFlow() {
  joinError.value = "";
  isJoined.value = false;
  agreeChecked.value = false;
  if (!teamId.value) {
    joinError.value = "連結缺少 team_id 參數。";
    return;
  }

  try {
    isJoining.value = true;
    // 確保 LIFF 環境有登入，才能拿到正確 line_user_id
    await liffService.ensureLogin();
    const lineUserId = await liffService.getUserId();
    await joinTeam({ team_id: teamId.value, line_user_id: lineUserId });
    // 進入加入成功畫面後，直接拉取隊伍資料（隊名/建立日期/隊員頭像）
    await teamStore.fetchTeamProgress(lineUserId);
    isJoined.value = true;
  } catch (e) {
    isJoined.value = false;
    const apiError = e as AxiosError<{ message?: string }>;
    joinError.value =
      apiError.response?.data?.message ||
      (e instanceof Error ? e.message : "加入隊伍失敗");
  } finally {
    isJoining.value = false;
  }
}

function goHome() {
  router.push({ name: "home" });
}

function goToMyTeam() {
  router.push({ name: "teamDetail" });
}

function joinLater() {
  router.push({ name: "home" });
}

function confirmJoin() {
  if (!agreeChecked.value) return;
  // 目前後端加入已完成；確認加入後先帶去打卡地點頁（如需改成其他頁再調）
  router.push({ name: "checkPlace" });
}

onMounted(() => {
  void joinTeamFlow();
});
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-[#f5f1f7] px-4 pt-[max(12px,env(safe-area-inset-top))] pb-8 text-[#333]">
    <header class="relative flex items-center justify-center py-2">
      <button
        type="button"
        aria-label="返回首頁"
        class="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-[28px] leading-none text-[#333]"
        @click="goHome"
      >
        ‹
      </button>
      <h1 class="text-[28px] font-extrabold leading-none tracking-tight text-[#222]">加入隊伍</h1>
    </header>

    <div
      v-if="joinError"
      class="mt-4 rounded-2xl bg-[#ffe8e8] px-4 py-4 text-[13px] text-[#a40000] shadow-[0_0_0_1px_rgba(0,0,0,0.03)]"
    >
      <p>{{ joinError }}</p>
      <button
        v-if="isAlreadyInAnotherTeam"
        type="button"
        class="mt-4 w-full rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] py-3 text-[15px] font-bold text-white"
        @click="goToMyTeam"
      >
        前往我的隊伍
      </button>
    </div>

    <div v-else-if="isJoining" class="mt-4 rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
      <p class="text-[16px] font-bold text-[#222]">加入隊伍中…</p>
      <p class="mt-2 text-[13px] text-[#666]">請稍候</p>
    </div>

    <section v-else-if="isJoined" class="mt-4 space-y-4">
      <!-- 邀請卡 -->
      <div class="flex items-center justify-between rounded-2xl bg-[#efe7ff] px-4 py-4 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
        <div>
          <p class="text-[16px] font-extrabold text-[#222]">您收到組隊邀請！</p>
          <p class="mt-1 text-[13px] text-[#444]">來自好友「{{ inviterName }}」的邀請</p>
        </div>
        <img :src="joinTeamHero" alt="" class="h-[88px] w-[88px] object-contain" />
      </div>

      <!-- 隊伍資訊 -->
      <div class="rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 overflow-hidden rounded-full bg-[#efe7ff] ring-1 ring-[#e0e0e0]">
              <img v-if="teamIconUrl" :src="teamIconUrl" alt="" class="h-full w-full object-cover" />
              <div v-else class="h-full w-full" />
            </div>
            <div>
              <p class="text-[18px] font-extrabold leading-none text-[#222]">{{ teamName }}</p>
            </div>
          </div>

          <span class="rounded-full border border-[#674598] px-3 py-1 text-[13px] font-bold text-[#674598]">
            招募中
          </span>
        </div>

        <div class="mt-3 space-y-1 text-[13px] text-[#333]">
          <p>隊長：{{ leaderName }}</p>
          <p>隊員：{{ members.length }}/{{ MAX_MEMBERS }}人</p>
          <p>建立：{{ createdDate }}</p>
        </div>

        <div class="mt-4 border-t border-[#e8e8e8] pt-4">
          <p class="text-[13px] font-extrabold text-[#333]">目前隊員</p>
          <div class="mt-3 grid grid-cols-5 gap-3">
            <div
              v-for="(m, idx) in members.slice(0, MAX_MEMBERS)"
              :key="`${m.name}-${idx}`"
              class="flex flex-col items-center"
            >
              <div class="h-12 w-12 overflow-hidden rounded-full border border-[#d8d8d8] bg-white">
                <img :src="m.avatarUrl" alt="" class="h-full w-full object-cover" />
              </div>
              <p class="mt-1 w-full truncate text-center text-[11px] text-[#333]">{{ m.name }}</p>
            </div>

            <template v-for="n in Math.max(0, MAX_MEMBERS - members.length)" :key="`empty-${n}`">
              <div class="flex flex-col items-center opacity-30">
                <div class="h-12 w-12 rounded-full border border-[#e8e8e8] bg-white" />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 規則同意與按鈕 -->
      <div class="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <label class="flex items-start gap-2 text-[13px] text-[#333]">
          <input
            v-model="agreeChecked"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border border-[#888] accent-[#674598]"
          />
          <span class="leading-6">我已閱讀並同意活動規則與個資聲明</span>
        </label>

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-full bg-[#d0d0d0] py-3 text-[15px] font-bold text-[#777]"
            @click="joinLater"
          >
            稍後再說
          </button>
          <button
            type="button"
            class="flex-1 rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] py-3 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="!agreeChecked"
            @click="confirmJoin"
          >
            確認加入
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
