<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { AxiosError } from "axios";
import { useRoute, useRouter } from "vue-router";
import { getTeamProgress, joinTeam } from "../services/apiClient";
import { liffService } from "../services/liffService";
import joinTeamHero from "../assets/images/join-team.png";
import teamInviteBg from "../assets/images/teaminvitebg.png";
import avatarFallback from "../assets/images/avatar.png";
import type { TeamProgressView } from "../types/teamProgress";

const route = useRoute();
const router = useRouter();

const MAX_MEMBERS = 5;

function singleQuery(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") return value[0].trim();
  return "";
}

const teamId = computed(() => singleQuery(route.query.team_id));
const inviterId = computed(() => singleQuery(route.query.inviter_id));

const isLoadingPage = ref(true);
const pageError = ref("");
const pageErrorKind = ref<"already_team" | "other" | "">("");

/** 以邀請者 progress API 取得的隊伍資料（顯示用） */
const inviteTeamData = ref<TeamProgressView | null>(null);

const agreeChecked = ref(false);
const isJoining = ref(false);
const joinSubmitError = ref("");

const selfLineUserId = ref("");

const members = computed(() => inviteTeamData.value?.members ?? []);
const teamName = computed(() => inviteTeamData.value?.teamName ?? "");
const createdDate = computed(() => inviteTeamData.value?.createdDate ?? "");
const leaderName = computed(() => {
  return members.value.find((m) => m.isCaptain)?.name ?? members.value[0]?.name ?? "";
});
const teamIconUrl = computed(() => {
  return (
    members.value.find((m) => m.isCaptain)?.avatarUrl ??
    members.value[0]?.avatarUrl ??
    (avatarFallback as string)
  );
});
const inviterName = computed(() => leaderName.value || "朋友");

const emptySlotCount = computed(() => Math.max(0, MAX_MEMBERS - members.value.length));

function sameTeamId(a: string, b: string): boolean {
  return String(a).trim() === String(b).trim();
}

async function loadInvitePage() {
  pageError.value = "";
  pageErrorKind.value = "";
  inviteTeamData.value = null;
  agreeChecked.value = false;
  joinSubmitError.value = "";
  isLoadingPage.value = true;

  if (!teamId.value || !inviterId.value) {
    pageError.value = "邀請連結缺少必要參數，請向隊長重新索取連結。";
    pageErrorKind.value = "other";
    isLoadingPage.value = false;
    return;
  }

  try {
    await liffService.ensureLogin();
    const lineUserId = await liffService.getUserId();
    selfLineUserId.value = lineUserId;

    const selfTeam = await getTeamProgress(lineUserId);
    if (selfTeam) {
      if (sameTeamId(selfTeam.teamId, teamId.value)) {
        pageError.value = "您已是此隊伍成員。";
        pageErrorKind.value = "already_team";
        isLoadingPage.value = false;
        return;
      }
      pageError.value = "您已加入其他隊伍，無法透過此連結再加入新隊伍。";
      pageErrorKind.value = "already_team";
      isLoadingPage.value = false;
      return;
    }

    const inviterTeam = await getTeamProgress(inviterId.value);
    if (!inviterTeam) {
      pageError.value = "無法讀取邀請隊伍資料，連結可能已失效，請向隊長重新索取。";
      pageErrorKind.value = "other";
      isLoadingPage.value = false;
      return;
    }

    if (!sameTeamId(inviterTeam.teamId, teamId.value)) {
      pageError.value = "邀請連結與隊伍資訊不符，請向隊長重新索取有效連結。";
      pageErrorKind.value = "other";
      isLoadingPage.value = false;
      return;
    }

    if (inviterTeam.members.length >= MAX_MEMBERS) {
      pageError.value = "此隊伍人數已滿，無法再加入。";
      pageErrorKind.value = "other";
      isLoadingPage.value = false;
      return;
    }

    inviteTeamData.value = inviterTeam;
  } catch (e) {
    pageError.value =
      e instanceof Error ? e.message : "載入邀請資訊失敗，請稍後再試或檢查網路連線。";
    pageErrorKind.value = "other";
  } finally {
    isLoadingPage.value = false;
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

async function confirmJoin() {
  if (!agreeChecked.value || !teamId.value || !selfLineUserId.value) return;
  joinSubmitError.value = "";
  try {
    isJoining.value = true;
    await joinTeam({ team_id: teamId.value, line_user_id: selfLineUserId.value });
    router.push({ name: "home" });
  } catch (e) {
    const apiError = e as AxiosError<{ message?: string }>;
    joinSubmitError.value =
      apiError.response?.data?.message ||
      (e instanceof Error ? e.message : "加入隊伍失敗，請稍後再試。");
  } finally {
    isJoining.value = false;
  }
}

onMounted(() => {
  void loadInvitePage();
});
</script>

<template>
  <main class="relative min-h-screen w-full overflow-hidden text-[#333]">
    <img :src="teamInviteBg" alt="" class="absolute inset-0 h-full w-full object-cover" />
    <section class="relative z-10 mx-auto min-h-screen w-full max-w-[393px] px-4 pt-[max(12px,env(safe-area-inset-top))] pb-8">
    <header class="relative flex items-center justify-center py-2">
      <button
        type="button"
        aria-label="關閉並回首頁"
        class="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-[28px] leading-none text-[#333]"
        @click="goHome"
      >
        ×
      </button>
      <h1 class="text-[28px] font-extrabold leading-none tracking-tight text-[#222]">加入隊伍</h1>
    </header>

    <div
      v-if="pageError"
      class="mt-4 rounded-2xl border border-[#f0d7dc] bg-white px-4 py-4 text-[13px] text-[#a40000] shadow-[0_0_0_1px_rgba(0,0,0,0.03)]"
    >
      <p>{{ pageError }}</p>
      <div class="mt-4 flex flex-col gap-2">
        <button
          type="button"
          class="w-full rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] py-3 text-[15px] font-bold text-white"
          @click="goHome"
        >
          回首頁
        </button>
        <button
          v-if="pageErrorKind === 'already_team'"
          type="button"
          class="w-full rounded-full border border-[#674598] py-3 text-[15px] font-bold text-[#674598]"
          @click="goToMyTeam"
        >
          前往我的隊伍
        </button>
      </div>
    </div>

    <div v-else-if="isLoadingPage" class="mt-4 rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
      <p class="text-[16px] font-bold text-[#222]">載入邀請資訊中…</p>
      <p class="mt-2 text-[13px] text-[#666]">請稍候</p>
    </div>

    <section v-else-if="inviteTeamData" class="mt-4 space-y-4">
      <!-- 邀請卡 -->
      <div class="flex items-center justify-between rounded-2xl bg-[#efe7ff] px-4 py-4 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
        <div class="min-w-0 flex-1 pr-2">
          <p class="text-[16px] font-extrabold text-[#222]">您收到組隊邀請！</p>
          <p class="mt-1 text-[13px] text-[#444]">來自好友「{{ inviterName }}」的邀請</p>
        </div>
        <img :src="joinTeamHero" alt="" class="h-[88px] w-[88px] shrink-0 object-contain" />
      </div>

      <!-- 隊伍資訊 -->
      <div class="rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#efe7ff] ring-1 ring-[#e0e0e0]">
              <img v-if="teamIconUrl" :src="teamIconUrl" alt="" class="h-full w-full object-cover" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-[18px] font-extrabold leading-tight text-[#222]">{{ teamName }}</p>
            </div>
          </div>

          <span class="shrink-0 rounded-full border border-[#674598] px-3 py-1 text-[13px] font-bold text-[#674598]">
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
          <div class="mt-3 grid grid-cols-5 gap-2">
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

            <div v-for="n in emptySlotCount" :key="`empty-${n}`" class="flex flex-col items-center opacity-40">
              <div class="h-12 w-12 rounded-full border border-[#d0d0d0] bg-[#ececec]" />
              <p class="mt-1 w-full text-center text-[10px] leading-tight text-[#888]">尚未邀請</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 規則同意與按鈕 -->
      <div class="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <p
          v-if="joinSubmitError"
          class="mb-3 rounded-lg border border-[#d9cdee] bg-white px-3 py-2 text-[12px] text-[#674598]"
        >
          {{ joinSubmitError }}
        </p>
        <label class="flex items-start gap-2 text-[13px] text-[#333]">
          <input
            v-model="agreeChecked"
            type="checkbox"
            class="mt-1 h-4 w-4 shrink-0 rounded border border-[#888] accent-[#674598]"
            :disabled="isJoining"
          />
          <span class="leading-6">
            我已閱讀並同意
            <router-link :to="{ name: 'checkEvent' }" class="font-semibold text-[#674598] underline">
              活動規則與個資聲明
            </router-link>
          </span>
        </label>

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-full bg-[#d0d0d0] py-3 text-[15px] font-bold text-[#777]"
            :disabled="isJoining"
            @click="joinLater"
          >
            稍後再說
          </button>
          <button
            type="button"
            class="flex-1 rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] py-3 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="!agreeChecked || isJoining"
            @click="confirmJoin"
          >
            {{ isJoining ? "加入中…" : "確認加入" }}
          </button>
        </div>
      </div>
    </section>
    </section>
  </main>
</template>
