<script setup lang="ts">
import { computed, ref } from "vue";

const emit = defineEmits<{
  back: [];
}>();

interface CheckPlaceItem {
  city: string;
  district: string;
  storeName: string;
  address: string;
}

const city = ref("新北市");
const cities = ["新北市", "台北市", "基隆市"];

const allLocations: CheckPlaceItem[] = [
  { city: "新北市", district: "三峽區", storeName: "85度C(三峽文化店)", address: "新北市三峽區文化路152號" },
  { city: "新北市", district: "板橋區", storeName: "85度C(板橋中山店)", address: "新北市板橋區中山路一段266號" },
  { city: "新北市", district: "新莊區", storeName: "85度C(新莊中平店)", address: "新北市新莊區中平路84號" },
  { city: "新北市", district: "中和區", storeName: "85度C(中和圓通店)", address: "新北市中和區中正路226號" },
  { city: "新北市", district: "永和區", storeName: "85度C(永和頂溪店)", address: "新北市永和區永和路二段105號" },
  { city: "新北市", district: "三重區", storeName: "85度C(三重三和店)", address: "新北市三重區三和路四段272號" },
  { city: "台北市", district: "中山區", storeName: "85度C(台北錦州店)", address: "台北市中山區錦州街28-8號" },
  { city: "台北市", district: "信義區", storeName: "85度C(台北永吉店)", address: "台北市信義區永吉路269號" },
  { city: "基隆市", district: "七堵區", storeName: "85度C(七堵明德店)", address: "基隆市七堵區明德一路212號一樓" },
];

const filteredLocations = computed(() =>
  allLocations.filter((item) => item.city === city.value),
);
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-[#f2f0f4] px-4 pt-[max(12px,env(safe-area-inset-top))] pb-6 text-[#1f1f1f]">
    <header class="relative flex items-center justify-center py-2">
      <button
        type="button"
        aria-label="返回首頁"
        class="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-[26px] leading-none"
        @click="emit('back')"
      >
        ‹
      </button>
      <h1 class="text-[26px] font-bold leading-none">可打卡地點</h1>
    </header>

    <section class="mt-3">
      <label for="city-select" class="sr-only">選擇縣市</label>
      <div class="relative">
        <select
          id="city-select"
          v-model="city"
          class="h-[42px] w-full appearance-none rounded-xl border border-[#cfd1d7] bg-white px-3 pr-9 text-[19px] leading-none outline-none"
        >
          <option v-for="item in cities" :key="item" :value="item">{{ item }}</option>
        </select>
        <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-[#7b7f88]">⌄</span>
      </div>
    </section>

    <section class="mt-4">
      <div class="border-y border-[#d9dbe1]">
        <div
          v-for="(row, index) in filteredLocations"
          :key="`${row.storeName}-${index}`"
          class="grid min-h-[46px] grid-cols-[74px_82px_1fr_1.3fr] items-center border-b border-[#d9dbe1] px-1 text-[14px] leading-[1.2] last:border-b-0"
        >
          <p class="pr-2">{{ row.city }}</p>
          <p class="pr-2">{{ row.district }}</p>
          <p class="pr-2 underline">{{ row.storeName }}</p>
          <p class="wrap-break-word underline">{{ row.address }}</p>
        </div>
      </div>
    </section>
  </main>
</template>
