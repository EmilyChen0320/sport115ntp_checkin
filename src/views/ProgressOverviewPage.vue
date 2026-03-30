<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import teamInviteBg from "../assets/images/teaminvitebg.png";
import avatarFallback from "../assets/images/avatar.png";
import { useTeamStore } from "../stores/teamStore";
import { liffService } from "../services/liffService";
import { getEventsProgress } from "../services/apiClient";
import {
  pickNewTaipeiProgressEvent,
  pickNewTaipeiStat,
  pickTaiwanProgressEvent,
  pickTaiwanStat,
} from "../utils/checkInProgressPick";

const router = useRouter();
const teamStore = useTeamStore();
const { teamData, isLoading, lastError } = storeToRefs(teamStore);

const tab = ref<"taiwan" | "newtaipei">("taiwan");
const eventsLoadError = ref("");
const eventsStats = ref<Awaited<ReturnType<typeof getEventsProgress>>>([]);
const showAllAreas = ref(false);

const twStat = computed(() => pickTaiwanStat(eventsStats.value));
const ntStat = computed(() => pickNewTaipeiStat(eventsStats.value));
const currentStat = computed(() => (tab.value === "taiwan" ? twStat.value : ntStat.value));

const teamTw = computed(() => pickTaiwanProgressEvent(teamData.value?.progress ?? []));
const teamNt = computed(() => pickNewTaipeiProgressEvent(teamData.value?.progress ?? []));
const currentTeamEv = computed(() => (tab.value === "taiwan" ? teamTw.value : teamNt.value));

const totalSlots = computed(() => (tab.value === "taiwan" ? 22 : 29));
const doneCount = computed(() => currentTeamEv.value?.completedAreas ?? 0);
const progressPct = computed(() =>
  totalSlots.value ? Math.min(100, Math.round((doneCount.value / totalSlots.value) * 100)) : 0,
);

const completedNames = computed(() =>
  (currentTeamEv.value?.areas ?? []).filter((a) => a.isCompleted).map((a) => a.areaName),
);

const completedSummaryText = computed(() => {
  const names = completedNames.value;
  if (!names.length) return "尚無已打卡紀錄";
  return `已打卡：${names.join("、")}`;
});

const sortedAreas = computed(() => {
  const areas = [...(currentStat.value?.areas ?? [])];
  areas.sort((a, b) => b.completedTeams - a.completedTeams);
  return showAllAreas.value ? areas : areas.slice(0, 6);
});

const maxTeams = computed(() => {
  const areas = currentStat.value?.areas ?? [];
  let m = 1;
  for (const a of areas) m = Math.max(m, a.completedTeams);
  return m;
});

function barPct(count: number) {
  if (maxTeams.value <= 0) return 0;
  return Math.min(100, Math.round((count / maxTeams.value) * 100));
}

const teamCardImg = computed(
  () => teamData.value?.teamIconUrl || teamData.value?.members[0]?.avatarUrl || (avatarFallback as string),
);

const memberCountLabel = computed(() => `${teamData.value?.members.length ?? 0}/5`);

function goTeamDetail() {
  router.push({ name: "teamDetail" });
}

function openTeamMap() {
  router.push({ name: "teamProgressMap" });
}

onMounted(async () => {
  const lineUserId = await liffService.getUserId();
  await teamStore.fetchTeamProgress(lineUserId);
  try {
    eventsStats.value = await getEventsProgress();
  } catch (e) {
    eventsLoadError.value = e instanceof Error ? e.message : "讀取活動統計失敗";
  }
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
          @click="goTeamDetail"
        >
          ‹
        </button>
        <h1 class="text-[17px] font-semibold leading-none">打卡進度</h1>
      </header>

      <p v-if="lastError" class="mt-2 rounded-lg bg-[#ffe8e8] px-3 py-2 text-[13px] text-[#a40000]">
        {{ lastError }}
      </p>
      <p v-if="eventsLoadError" class="mt-2 rounded-lg bg-[#fff8e6] px-3 py-2 text-[13px] text-[#8a6200]">
        {{ eventsLoadError }}
      </p>

      <div v-if="isLoading && !teamData" class="mt-6 text-center text-[14px] text-[#666]">載入中…</div>

      <template v-else-if="teamData">
        <div
          class="mt-4 rounded-xl border border-[#f1f5f9] bg-white p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
        >
          <div class="flex items-center gap-2">
            <img
              :src="teamCardImg"
              alt=""
              class="h-[54px] w-[54px] shrink-0 rounded-full border border-[#bca9d1] object-cover"
              @error="($event.target as HTMLImageElement).src = avatarFallback as string"
            />
            <div class="min-w-0 flex-1">
              <p class="text-[12px] text-[#333333b3]">我的隊伍</p>
              <p class="text-[17px] font-extrabold tracking-wide">{{ teamData.teamName }}</p>
              <p class="text-[14px] text-[#333333b3]">隊員：{{ memberCountLabel }} 人</p>
            </div>
            <button
              type="button"
              class="h-[28px] shrink-0 rounded-full bg-[#674598] px-3 text-[14px] font-bold text-[#eeeaf5]"
              @click="openTeamMap"
            >
              查看
            </button>
          </div>
        </div>

        <div class="mt-4 flex gap-3">
          <div
            class="relative flex-1 overflow-hidden rounded-xl bg-[#bca9d1] p-2 text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
          >
            <div class="inline-block rounded-xl bg-[#674598] px-2 py-1 text-[12px] font-bold">臺灣22縣市</div>
            <p class="mt-2 pl-1 text-[14px] font-bold">已完成隊伍</p>
            <div class="mt-1 flex items-end gap-1 pl-1">
              <span class="text-[28px] font-extrabold leading-none">{{ twStat?.completedTeams ?? 0 }}</span>
              <span class="pb-0.5 text-[14px] font-bold">組</span>
            </div>
          </div>
          <div
            class="relative flex-1 overflow-hidden rounded-xl bg-[#a2d6d5] p-2 text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
          >
            <div class="inline-block rounded-xl bg-[#05aac3] px-2 py-1 text-[12px] font-bold">新北市29區</div>
            <p class="mt-2 pl-1 text-[14px] font-bold">已完成隊伍</p>
            <div class="mt-1 flex items-end gap-1 pl-1">
              <span class="text-[28px] font-extrabold leading-none">{{ ntStat?.completedTeams ?? 0 }}</span>
              <span class="pb-0.5 text-[14px] font-bold">組</span>
            </div>
          </div>
        </div>

        <div class="mt-4 overflow-hidden rounded-t-xl border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
          <div class="flex border-b border-[#e2e8f0]">
            <button
              type="button"
              class="flex-1 py-4 text-[15px] font-bold transition-colors"
              :class="
                tab === 'taiwan' ? 'border-b-2 border-[#674598] text-[#674598]' : 'text-[#a2d6d5]'
              "
              @click="tab = 'taiwan'"
            >
              全臺22縣市
            </button>
            <button
              type="button"
              class="flex-1 py-4 text-[15px] font-bold transition-colors"
              :class="
                tab === 'newtaipei' ? 'border-b-2 border-[#674598] text-[#674598]' : 'text-[#a2d6d5]'
              "
              @click="tab = 'newtaipei'"
            >
              新北市29區
            </button>
          </div>

          <div class="px-4 py-5">
            <div class="rounded-xl border border-[#bca9d1] bg-[rgba(238,234,245,0.5)] p-4">
              <div class="mb-2 flex items-end justify-between">
                <p class="text-[15px] font-bold">{{ tab === "taiwan" ? "臺灣22縣市" : "新北市29區" }}</p>
                <p class="text-[15px] font-bold">{{ doneCount }}/{{ totalSlots }}</p>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-[rgba(188,169,209,0.3)]">
                <div
                  class="h-full rounded-full bg-[#674598] transition-[width]"
                  :style="{ width: `${progressPct}%` }"
                ></div>
              </div>
              <p class="mt-2 line-clamp-2 text-[12px] text-[#333333b3]">{{ completedSummaryText }}</p>
            </div>

            <div class="mt-6">
              <p class="mb-3 -skew-x-6 text-[15px] font-bold">
                {{ tab === "taiwan" ? "各縣市打卡數量" : "各行政區打卡數量" }}
              </p>
              <div v-if="!sortedAreas.length" class="rounded-lg border border-[#ededed] bg-white px-3 py-4 text-[13px] text-[#777]">
                暫無區域統計資料
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="(row, idx) in sortedAreas"
                  :key="`${row.areaId}-${idx}`"
                  class="flex h-[52px] items-center gap-3 rounded-[10px] border border-[#ededed] bg-white px-3 shadow-[0px_0px_1px_rgba(0,0,0,0.15)]"
                >
                  <p class="w-[52px] shrink-0 text-[15px] text-[#333333b3]">{{ row.areaName }}</p>
                  <div class="min-w-0 flex-1">
                    <div class="h-[6px] overflow-hidden rounded-full bg-[rgba(188,169,209,0.2)]">
                      <div
                        class="h-full rounded-full bg-[#674598]"
                        :style="{ width: `${barPct(row.completedTeams)}%` }"
                      ></div>
                    </div>
                  </div>
                  <p class="w-[72px] shrink-0 text-right text-[15px] text-[#333333b3]">
                    {{ row.completedTeams }} 次
                  </p>
                </div>
              </div>

              <button
                v-if="(currentStat?.areas.length ?? 0) > 6"
                type="button"
                class="mt-4 w-full py-2 text-center text-[14px] text-[#333] underline"
                @click="showAllAreas = !showAllAreas"
              >
                {{ showAllAreas ? "收起列表" : tab === "taiwan" ? "查看全部22個縣市" : "查看全部29個行政區" }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>
