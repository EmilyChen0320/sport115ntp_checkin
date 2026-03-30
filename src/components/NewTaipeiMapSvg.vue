<script setup lang="ts">
import { computed } from "vue";
import { NEW_TAIPEI_DISTRICT_GEOMS, NEW_TAIPEI_MAP_VIEWBOX } from "../data/newTaipeiDistrictGeoms";
import { normalizeNewTaipeiDistrictName } from "../utils/areaNameMapping";

const props = defineProps<{
  completedAreaNames: string[];
}>();

const FILL_DONE = "#6ACDCB";
// 依照你提供的圖：A2D6D5，並搭配約 40% 透明度
const FILL_TODO = "rgba(162, 214, 213, 0.4)";

const completed = computed(() => {
  const s = new Set<string>();
  for (const n of props.completedAreaNames) {
    s.add(normalizeNewTaipeiDistrictName(n));
  }
  return s;
});

const LABELS: Record<string, { x: number; y: number }> = {
  板橋區: { x: 151, y: 315.7 },
  // 解決與「蘆洲區」重疊：三重往下往右
  三重區: { x: 206.8, y: 235.5 },
  中和區: { x: 197.5, y: 295.6 },
  永和區: { x: 211.3, y: 280.6 },
  新莊區: { x: 161.9, y: 280.5 },
  新店區: { x: 319.1, y: 327.5 },
  樹林區: { x: 110.9, y: 302.3 },
  鶯歌區: { x: 75.3, y: 326.6 },
  三峽區: { x: 124.5, y: 400.2 },
  淡水區: { x: 126.7, y: 175.6 },
  汐止區: { x: 380.6, y: 361.8 },
  瑞芳區: { x: 470.2, y: 284.5 },
  土城區: { x: 224.5, y: 349.8 },
  蘆洲區: { x: 170.4, y: 218.3 },
  五股區: { x: 136, y: 191.7 },
  泰山區: { x: 141.3, y: 257.6 },
  林口區: { x: 126.7, y: 233.7 },
  深坑區: { x: 296.4, y: 288.4 },
  石碇區: { x: 409.8, y: 262.1 },
  坪林區: { x: 315.7, y: 129.6 },
  三芝區: { x: 168.8, y: 126.5 },
  石門區: { x: 246.9, y: 57.6 },
  八里區: { x: 70.9, y: 198.1 },
  平溪區: { x: 331.5, y: 210.7 },
  雙溪區: { x: 471.5, y: 204.7 },
  貢寮區: { x: 548.1, y: 249.6 },
  金山區: { x: 202.2, y: 84 },
  萬里區: { x: 282.9, y: 93.1 },
  // 烏來往左一點
  烏來區: { x: 244.2, y: 475.7 },
};
</script>

<template>
  <svg
    :viewBox="NEW_TAIPEI_MAP_VIEWBOX"
    class="mx-auto block h-auto w-full max-w-none"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="新北市29區地圖"
  >
    <path
      v-for="d in NEW_TAIPEI_DISTRICT_GEOMS"
      :key="d.name"
      :d="d.path"
      :fill="completed.has(d.name) ? FILL_DONE : FILL_TODO"
      stroke="#ffffff"
      stroke-width="0.9"
      stroke-linejoin="round"
    />
    <text
      v-for="d in NEW_TAIPEI_DISTRICT_GEOMS"
      :key="`label-${d.name}`"
      :x="LABELS[d.name]?.x ?? 0"
      :y="LABELS[d.name]?.y ?? 0"
      text-anchor="middle"
      dominant-baseline="middle"
      font-size="14"
      font-weight="600"
      fill="#111111"
      stroke="#ffffff"
      stroke-width="2.5"
      paint-order="stroke"
    >
      {{ d.name }}
    </text>
  </svg>
</template>
