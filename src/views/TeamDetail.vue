<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import teamCreatedHero from "../assets/images/teamcreatedheroimage.png";
import teamCreatedContainer from "../assets/images/teamcreatedContainer.png";
import avatarFallback from "../assets/images/avatar.png";
import { useTeamStore } from "../stores/teamStore";
import { liffService } from "../services/liffService";

const router = useRouter();
const teamStore = useTeamStore();
const { teamData, isLoading, lastError } = storeToRefs(teamStore);

/** 載入頁面時快取，避免「邀請」點擊時 await 打斷 user gesture（iOS/LINE 會導致 shareTargetPicker 失敗） */
const myLineUserId = ref("");

const teamName = computed(() => teamData.value?.teamName ?? "");
const createdDate = computed(() => teamData.value?.createdDate ?? "");
const members = computed(() => teamData.value?.members ?? []);

const taiwan22 = computed(() => teamData.value?.taiwan22Completed ?? 0);
const newTaipei29 = computed(() => teamData.value?.newTaipei29Completed ?? 0);

const taiwanPct = computed(() => Math.min(100, Math.round((taiwan22.value / 22) * 100)));
const newTaipeiPct = computed(() => Math.min(100, Math.round((newTaipei29.value / 29) * 100)));

const memberRatioLabel = computed(() => {
  const n = members.value.length;
  return `${n}/5`;
});

const showUnderFiveHint = computed(() => members.value.length < 5);

const canInvite = computed(() => Boolean(teamData.value?.teamId && myLineUserId.value));

async function loadTeam() {
  const lineUserId = await liffService.getUserId();
  myLineUserId.value = lineUserId;
  await teamStore.fetchTeamProgress(lineUserId);
}

function goHome() {
  router.push({ name: "home" });
}

function openMapProgress() {
  router.push({ name: "checkPlace" });
}

/** 不可在此 await API：須在點擊同一個同步流程內呼叫 shareTargetPicker */
function onInviteClick() {
  if (!teamData.value?.teamId || !myLineUserId.value) return;
  liffService.inviteTeamMemberViaTextShareTargetPicker({
    teamId: teamData.value.teamId,
    teamName: teamData.value.teamName,
    memberCount: members.value.length,
    maxMembers: 5,
    inviterId: myLineUserId.value,
  });
}

onMounted(() => {
  void loadTeam();
});
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-[#f5f1f7] px-4 pt-[max(10px,env(safe-area-inset-top))] pb-6 text-[#333]">
    <header class="relative flex items-center justify-center py-2">
      <button
        type="button"
        aria-label="返回"
        class="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-[28px] leading-none"
        @click="goHome"
      >
        ‹
      </button>
      <h1 class="text-[22px] font-bold leading-none">我的隊伍</h1>
    </header>

    <p v-if="lastError" class="mt-2 rounded-lg bg-[#ffe8e8] px-3 py-2 text-[13px] text-[#a40000]">
      {{ lastError }}
    </p>

    <div
      v-if="!isLoading && !teamData"
      class="mt-4 rounded-xl bg-white/90 px-4 py-5 text-center text-[15px] text-[#555777] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
    >
      <p v-if="!lastError">目前尚無隊伍資料（API 回傳此使用者尚無隊伍）。</p>
      <p v-else class="text-left text-[13px] leading-relaxed text-[#555]">
        若已設定代理與 token 仍失敗，請對照 Network 面板；您仍可先填寫組隊表單。
      </p>
      <button
        type="button"
        class="mt-3 block w-full rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] py-2 text-[16px] font-bold text-white"
        @click="router.push({ name: 'createTeam' })"
      >
        前往我要組隊
      </button>
    </div>

    <template v-else-if="teamData">
      <section class="mt-3 overflow-hidden">
        <img :src="teamCreatedHero" alt="115年全國身心障礙國民運動會 無礙逐光" class="block w-full" />
      </section>

      <section class="relative mt-0">
        <img :src="teamCreatedContainer" alt="" class="block w-full" role="presentation" />
        <div class="absolute inset-0 flex flex-col justify-center px-4 py-2">
          <p class="text-[20px] font-extrabold leading-none text-[#333]">{{ teamName }}</p>
          <p class="mt-2 text-[14px] text-[#333333cc]">隊伍建立日期：{{ createdDate }}</p>
        </div>
      </section>

      <section class="mt-4 rounded-2xl bg-[#e8f1f2] p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-[20px] font-extrabold leading-none">打卡進度</h2>
          <button type="button" class="flex items-center text-[16px] text-[#674598]" @click="openMapProgress">
            查看<span class="ml-1">›</span>
          </button>
        </div>

        <article class="rounded-xl bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div class="flex items-center justify-between">
            <p class="text-[18px] font-bold">台灣22縣市路線</p>
            <p class="text-[20px] font-extrabold">({{ taiwan22 }}/22)</p>
          </div>
          <div class="mt-2 h-[6px] overflow-hidden rounded-full bg-[#e9e3ef]">
            <div class="h-full rounded-full bg-[#674598] transition-[width]" :style="{ width: `${taiwanPct}%` }"></div>
          </div>
          <p class="mt-2 text-[13px] text-[#333333aa]">已打卡：{{ taiwan22 }} 個縣市</p>
        </article>

        <article class="mt-3 rounded-xl bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div class="flex items-center justify-between">
            <p class="text-[18px] font-bold">新北29區路線</p>
            <p class="text-[20px] font-extrabold">({{ newTaipei29 }}/29)</p>
          </div>
          <div class="mt-2 h-[6px] overflow-hidden rounded-full bg-[#dfeff0]">
            <div class="h-full rounded-full bg-[#2f9e8e] transition-[width]" :style="{ width: `${newTaipeiPct}%` }"></div>
          </div>
          <p class="mt-2 text-[13px] text-[#333333aa]">已打卡：{{ newTaipei29 }} 個行政區</p>
        </article>
      </section>

      <section class="mt-4">
        <h2 class="text-[22px] font-extrabold leading-none">隊員列表 ({{ memberRatioLabel }})</h2>

        <div class="mt-3 overflow-hidden rounded-2xl border border-[#d8d8d8] bg-white">
          <div
            v-for="(member, index) in members"
            :key="`${member.name}-${index}`"
            class="flex items-center gap-3 px-3 py-3"
            :class="{ 'border-b border-[#dddddd]': index !== members.length - 1 }"
          >
            <img
              :src="member.avatarUrl"
              alt=""
              class="h-[54px] w-[54px] rounded-full border border-[#bca9d1] object-cover"
              @error="($event.target as HTMLImageElement).src = avatarFallback as string"
            />

            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1">
                  <p class="text-[16px] font-bold">{{ member.name }}</p>
                  <span
                    v-if="member.isCaptain"
                    class="rounded-full border border-[#eeeaf5] bg-[#674598] px-2 py-[2px] text-[11px] text-[#eeeaf5]"
                  >
                    隊長
                  </span>
                </div>
                <p class="text-[12px]">打卡次數：{{ member.checkInCount }}次</p>
              </div>
              <p v-if="showUnderFiveHint" class="mt-1 text-[11px] text-[#333333b3]">人數需滿五人才可開始打卡</p>
            </div>

            <span class="text-[18px] text-[#555]">⌄</span>
          </div>

          <div class="p-3">
            <button
              type="button"
              class="h-[42px] w-full rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] text-[18px] font-bold text-white disabled:opacity-45"
              :disabled="!canInvite"
              @click="onInviteClick"
            >
              ＋ 邀請新隊員
            </button>
          </div>
        </div>
      </section>
    </template>

    <p v-else-if="isLoading" class="mt-6 text-center text-[14px] text-[#666]">載入隊伍資料中…</p>
  </main>
</template>
