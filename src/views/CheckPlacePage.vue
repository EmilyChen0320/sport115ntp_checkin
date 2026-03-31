<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getCheckInAreas, type CheckInAreaPointView } from "../services/apiClient";

const router = useRouter();

const city = ref("");
const locations = ref<CheckInAreaPointView[]>([]);
const isLoading = ref(false);
const loadError = ref("");

const cities = computed(() => {
  const values = Array.from(new Set(locations.value.map((item) => item.city).filter(Boolean)));
  return values.sort((a, b) => a.localeCompare(b, "zh-Hant"));
});

const filteredLocations = computed(() => {
  if (!city.value) return locations.value;
  return locations.value.filter((item) => item.city === city.value);
});

async function loadAreas() {
  isLoading.value = true;
  loadError.value = "";
  try {
    const rows = await getCheckInAreas();
    locations.value = rows;
    if (!city.value || !cities.value.includes(city.value)) {
      city.value = cities.value[0] ?? "";
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : "讀取可打卡地點失敗，請稍後再試。";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadAreas();
});
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-[#f2f0f4] px-4 pt-[max(12px,env(safe-area-inset-top))] pb-6 text-[#1f1f1f]">
    <header class="relative flex items-center justify-center py-2">
      <button
        type="button"
        aria-label="返回首頁"
        class="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-[26px] leading-none"
        @click="router.push({ name: 'home' })"
      >
        ‹
      </button>
      <h1 class="text-[22px] font-bold leading-none">可打卡地點</h1>
    </header>

    <section class="mt-3">
      <label for="city-select" class="sr-only">選擇縣市</label>
      <div class="relative">
        <select
          id="city-select"
          v-model="city"
          :disabled="isLoading || !cities.length"
          class="h-[42px] w-full appearance-none rounded-xl border border-[#cfd1d7] bg-white px-3 pr-9 text-[19px] leading-none outline-none"
        >
          <option v-if="!cities.length" value="">{{ isLoading ? "載入中..." : "尚無資料" }}</option>
          <option v-for="item in cities" :key="item" :value="item">{{ item }}</option>
        </select>
        <svg
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7f88]"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </section>

    <section class="mt-4">
      <div
        v-if="loadError"
        class="rounded-xl border border-[#f0d7dc] bg-white px-3 py-3 text-[13px] text-[#a40000]"
      >
        <p>{{ loadError }}</p>
        <button
          type="button"
          class="mt-3 rounded-full border border-[#674598] px-3 py-1 text-[12px] font-bold text-[#674598]"
          @click="loadAreas"
        >
          重新載入
        </button>
      </div>

      <div v-else-if="isLoading" class="rounded-xl border border-[#d9dbe1] bg-white px-3 py-4 text-[13px] text-[#555]">
        載入可打卡地點中...
      </div>

      <div v-else-if="!filteredLocations.length" class="rounded-xl border border-[#d9dbe1] bg-white px-3 py-4 text-[13px] text-[#555]">
        目前沒有可顯示的打卡地點
      </div>

      <div v-else class="border-y border-[#d9dbe1]">
        <div
          v-for="(row, index) in filteredLocations"
          :key="`${row.pointId}-${index}`"
          class="grid min-h-[46px] grid-cols-[74px_1fr_1.3fr] items-center border-b border-[#d9dbe1] px-1 text-[14px] leading-[1.2] last:border-b-0"
        >
          <p class="pr-2">{{ row.city }}</p>
          <p class="pr-2 underline">{{ row.storeName }}</p>
          <p class="wrap-break-word underline">{{ row.address }}</p>
        </div>
      </div>
    </section>
  </main>
</template>
