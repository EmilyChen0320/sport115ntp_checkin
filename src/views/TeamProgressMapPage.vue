<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import teamInviteBg from "../assets/images/teaminvitebg.png";
import avatarFallback from "../assets/images/avatar.png";
import torchIcon from "../assets/images/torch_icon.png";
import { useTeamStore } from "../stores/teamStore";
import { liffService } from "../services/liffService";
import TaiwanMapSvg from "../components/TaiwanMapSvg.vue";
import NewTaipeiMapSvg from "../components/NewTaipeiMapSvg.vue";
import { pickNewTaipeiProgressEvent, pickTaiwanProgressEvent } from "../utils/checkInProgressPick";

const router = useRouter();
const teamStore = useTeamStore();
const { teamData, isLoading, lastError } = storeToRefs(teamStore);

const tab = ref<"taiwan" | "newtaipei">("taiwan");

const currentEv = computed(() => {
  const p = teamData.value?.progress ?? [];
  return tab.value === "taiwan" ? pickTaiwanProgressEvent(p) : pickNewTaipeiProgressEvent(p);
});

const isFullTeam = computed(() => (teamData.value?.members.length ?? 0) >= 5);

const captainName = computed(() => teamData.value?.members.find((m) => m.isCaptain)?.name ?? "—");

const teamHeroImg = computed(
  () => teamData.value?.teamIconUrl || teamData.value?.members.find((m) => m.isCaptain)?.avatarUrl || (avatarFallback as string),
);

const displayMembers = computed(() => {
  const m = teamData.value?.members ?? [];
  return Array.from({ length: 5 }, (_, i) => m[i] ?? null);
});

const totalSlots = computed(() => (tab.value === "taiwan" ? 22 : 29));
const doneCount = computed(() => currentEv.value?.completedAreas ?? 0);
const memberNotCheckedInCount = computed(() => {
  const members = teamData.value?.members ?? [];
  if (tab.value === "newtaipei") {
    return members.filter(
      (m) => !m.checkInPoints.some((p) => /新北/.test(p.address)),
    ).length;
  }
  return members.filter((m) => (m.checkInCount ?? 0) <= 0).length;
});
const threshold = computed(() => (tab.value === "taiwan" ? 5 : 10));
const isLotteryQualified = computed(
  () => isFullTeam.value && doneCount.value >= threshold.value && memberNotCheckedInCount.value === 0,
);
const progressPct = computed(() => {
  if (!isFullTeam.value || !totalSlots.value) return 0;
  return Math.min(100, Math.round((doneCount.value / totalSlots.value) * 100));
});
const accentColor = computed(() => (tab.value === "taiwan" ? "#674598" : "#05aac3"));
const accentBgLight = computed(() => (tab.value === "taiwan" ? "rgba(188,169,209,0.1)" : "rgba(5,170,195,0.1)"));
const accentTrackBg = computed(() => (tab.value === "taiwan" ? "rgba(188,169,209,0.2)" : "rgba(5,170,195,0.15)"));

const statusTitle = computed(() => {
  if (!isFullTeam.value) return "尚未成隊";
  const n = doneCount.value;
  // 抽獎門檻：全臺22縣市完成 5 個、 新北市29區完成 10 個

  const unitLong = tab.value === "taiwan" ? "縣市" : "行政區";
  const unitShort = tab.value === "taiwan" ? "縣市" : "區";

  if (isLotteryQualified.value) return `已完成 ${n} ${unitShort}，達成抽獎門檻！`;
  if (n >= threshold.value && memberNotCheckedInCount.value > 0) {
    return `已完成${n}${unitShort}打卡，還需要每個隊員都打卡喔`;
  }
  const remaining = Math.max(0, threshold.value - n);
  return `已完成 ${n} ${unitShort}，還差 ${remaining} ${unitLong}達成抽獎門檻！`;
});

const showLotteryBadge = computed(() => isLotteryQualified.value);
const showRelayBadge = computed(() => !showLotteryBadge.value);

const completedForMap = computed(() =>
  (currentEv.value?.areas ?? []).filter((a) => a.isCompleted).map((a) => a.areaName),
);

const completedList = computed(() => completedForMap.value);

const listTitle = computed(() => (tab.value === "taiwan" ? "已完成縣市" : "已完成行政區"));

function goProgressOverview() {
  router.push({ name: "progressOverview" });
}

function goCheckIn() {
  if (!isFullTeam.value) return;
  router.push({ name: "checkIn" });
}

onMounted(async () => {
  const lineUserId = await liffService.getUserId();
  await teamStore.fetchTeamProgress(lineUserId);
});
</script>

<template>
  <main class="relative min-h-screen w-full overflow-hidden bg-[#fdf9f7] text-[#333]">
    <img :src="teamInviteBg" alt="" class="absolute inset-0 h-full w-full object-cover opacity-80" />
    <section
      class="relative z-10 mx-auto min-h-screen w-full max-w-[393px] px-4 pb-8 pt-[max(12px,env(safe-area-inset-top))]"
    >
      <header class="relative flex items-center justify-center py-2">
        <button
          type="button"
          aria-label="返回"
          class="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-[28px] leading-none"
          @click="goProgressOverview"
        >
          ‹
        </button>
        <h1 class="text-[22px] font-semibold leading-none">我的隊伍</h1>
      </header>

      <p v-if="lastError" class="mt-2 rounded-lg bg-[#ffe8e8] px-3 py-2 text-[13px] text-[#a40000]">
        {{ lastError }}
      </p>

      <p v-if="isLoading && !teamData" class="mt-6 text-center text-[14px] text-[#666]">載入中…</p>

      <template v-else-if="teamData">
        <div
          class="mt-4 rounded-xl border border-[#f1f5f9] bg-white p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
        >
          <div class="flex gap-2">
            <img
              :src="teamHeroImg"
              alt=""
              class="h-[54px] w-[54px] shrink-0 rounded-full border border-[#bca9d1] object-cover"
              @error="($event.target as HTMLImageElement).src = avatarFallback as string"
            />
            <div class="min-w-0 flex-1 py-1">
              <p class="text-[12px] text-[#333333b3]">我的隊伍</p>
              <p class="text-[17px] font-extrabold tracking-wide">{{ teamData.teamName }}</p>
              <p class="mt-0.5 text-[14px] text-[#333333b3]">
                隊長：{{ captainName }}　隊員 {{ teamData.members.length }}/5 人
              </p>
            </div>
            <div v-if="isFullTeam" class="flex shrink-0 items-center justify-center">
              <span class="rounded-full border border-[#674598] bg-[#eeeaf5] px-3 py-1 text-[12px] text-[#674598]">
                已成隊
              </span>
            </div>
          </div>

          <div class="mt-4 border-t border-[#f1f5f9] pt-4">
            <div class="flex justify-between gap-1">
              <div
                v-for="(slot, idx) in displayMembers"
                :key="idx"
                class="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <template v-if="slot">
                  <img
                    :src="slot.avatarUrl"
                    alt=""
                    class="h-[47px] w-[47px] rounded-full border object-cover"
                    :class="slot.isCaptain ? 'border-[2.5px] border-[#674598]' : 'border border-[#bca9d1]'"
                    @error="($event.target as HTMLImageElement).src = avatarFallback as string"
                  />
                  <p class="w-full truncate text-center text-[12px] text-[#333333b3]">{{ slot.name }}</p>
                </template>
                <template v-else>
                  <div
                    class="flex h-[47px] w-[47px] items-center justify-center rounded-full border border-dashed border-[#cfd1d7] bg-[#f8fafc] text-[10px] text-[#999]"
                  >
                    —
                  </div>
                  <p class="text-center text-[12px] text-[#333333b3]">尚未邀請</p>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 overflow-hidden rounded-t-xl border border-[#e2e8f0] bg-white shadow-[0px_0px_2px_rgba(0,0,0,0.1)]">
          <div class="flex border-b border-[#e2e8f0]">
            <button
              type="button"
              class="flex-1 py-4 text-[15px] font-bold text-[#674598] transition-opacity"
              :class="tab === 'taiwan' ? 'border-b-2 border-[#674598] opacity-100' : 'border-b-2 border-transparent opacity-70'"
              @click="tab = 'taiwan'"
            >
              全臺22縣市
            </button>
            <button
              type="button"
              class="flex-1 py-4 text-[15px] font-bold text-[#05aac3] transition-opacity"
              :class="tab === 'newtaipei' ? 'border-b-2 border-[#05aac3] opacity-100' : 'border-b-2 border-transparent opacity-70'"
              @click="tab = 'newtaipei'"
            >
              新北市29區
            </button>
          </div>

          <div class="px-4 py-5">
            <div class="mb-4 flex items-center justify-between gap-2">
              <p class="text-[12px]">{{ statusTitle }}</p>
              <span
                v-if="showLotteryBadge"
                class="shrink-0 rounded-full border border-[#ffefc4] bg-[#fbbf24] px-2 py-0.5 text-[10px] font-bold text-white"
              >
                已獲抽獎資格
              </span>
              <span
                v-else-if="showRelayBadge"
                class="shrink-0 rounded-full bg-[rgba(51,51,51,0.4)] px-2 py-0.5 text-[10px] font-bold text-white"
              >
                聖火傳遞ing
              </span>
            </div>
            <div class="h-[10px] overflow-hidden rounded-full" :style="{ background: accentTrackBg }">
              <div
                class="h-full rounded-full transition-[width]"
                :style="{ width: `${progressPct}%`, background: accentColor }"
              ></div>
            </div>

            <div
              class="mt-4 rounded-[10px] border border-[#ededed] p-2 shadow-[0px_0px_1px_rgba(0,0,0,0.15)]"
              :style="{ background: accentBgLight }"
            >
              <div
                class="flex min-h-[300px] w-full items-center justify-center px-1 py-1 sm:min-h-[360px]"
              >
                <div class="w-full max-w-full [&_svg]:min-h-[380px] [&_svg]:min-w-0">
                  <TaiwanMapSvg v-if="tab === 'taiwan'" :completed-area-names="completedForMap" />
                  <NewTaipeiMapSvg v-else :completed-area-names="completedForMap" />
                </div>
              </div>
            </div>

            <div class="mt-6 border-t border-[#f1f5f9] pt-5">
              <p class="mb-3 text-[15px] font-bold">{{ listTitle }}</p>
              <div class="rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-4 py-3">
                <div v-if="completedList.length" class="flex flex-wrap gap-2">
                  <span
                    v-for="name in completedList"
                    :key="name"
                    class="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[13px] font-bold text-[#333]"
                  >
                    <img :src="torchIcon" alt="" class="h-4 w-4" />
                    {{ name }}
                  </span>
                </div>
                <p v-else class="text-[13px] font-bold leading-relaxed text-[#666]">尚無已完成區域</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 px-0 pb-6">
          <button
            type="button"
            class="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[16px] font-medium text-white shadow-[0px_0px_6px_#bca9d1] disabled:opacity-40"
            :class="isFullTeam ? 'bg-linear-to-r from-[#674598] to-[#bca9d1]' : 'bg-[rgba(51,51,51,0.4)]'"
            :disabled="!isFullTeam"
            @click="goCheckIn"
          >
            前往打卡
          </button>
        </div>
      </template>
    </section>
  </main>
</template>
