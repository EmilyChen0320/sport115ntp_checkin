<script setup lang="ts">
import taiwanMap from "@svg-maps/taiwan";
import { computed } from "vue";
import { areaNameToTaiwanSvgId } from "../utils/areaNameMapping";

const props = defineProps<{
  completedAreaNames: string[];
}>();

const FILL_DONE = "#BCA9D1";
const FILL_TODO = "#EEEAF5";

const completedIds = computed(() => {
  const s = new Set<string>();
  for (const n of props.completedAreaNames) {
    const id = areaNameToTaiwanSvgId(n);
    if (id) s.add(id);
  }
  return s;
});

const FULL_VIEWBOX = "0 0 1120 1295";
const ISLAND_IDS = ["kinmen-county", "penghu-county", "lienchiang-county"] as const;
const ISLAND_SET = new Set<string>(ISLAND_IDS);
const MAINLAND_SCALE = 1.33;
const MAINLAND_TX = -392;
const MAINLAND_TY = -398;
const ISLAND_GRAPH_SCALE_MULT = 1;

/**
 * 離島 bbox（由 svg-path-bounds 精確計算）+ 定位參數
 * 使用 bbox 左上角對齊法：translate(tx,ty) scale(s) translate(-minX,-minY)
 * 這樣 bbox 的左上角固定在 (tx, ty)，寬高 = w*s, h*s
 */
const ISLAND_INSET: Record<
  string,
  { minX: number; minY: number; w: number; h: number; tx: number; ty: number; scale: number }
> = {
  "lienchiang-county": {
    minX: 449.1, minY: 1.0, w: 156.2, h: 129.3,
    tx: 30, ty: 30, scale: 1.85,
  },
  "kinmen-county": {
    minX: 1.0, minY: 407.6, w: 333.3, h: 175.2,
    tx: 15, ty: 310, scale: 1.1,
  },
  "penghu-county": {
    minX: 289.5, minY: 764.9, w: 95.7, h: 162.5,
    tx: 20, ty: 620, scale: 1.95,
  },
};

// 各島文字（以 bbox 中心為局部座標）微調，確保文字落在圖形上
const ISLAND_LABEL_OFFSET: Record<string, { dx: number; dy: number }> = {
  "kinmen-county": { dx: -46, dy: 36 },
  "lienchiang-county": { dx: -20, dy: 0 },
  "penghu-county": { dx: -20, dy: -6 },
};

const TW_LABELS: Record<string, { text: string; x: number; y: number; size?: number }> = {
  "keelung-city": { text: "基隆市", x: 937.8, y: 360.4, size: 22 },
  "taipei-city": { text: "臺北市", x: 860.6, y: 390.8, size: 22 },
  "new-taipei-city": { text: "新北市", x: 907.7, y: 415.8, size: 22 },
  "taoyuan-city": { text: "桃園市", x: 784.6, y: 447, size: 22 },
  "hsinchu-city": { text: "新竹市", x: 712, y: 470.6, size: 20 },
  "hsinchu-county": { text: "新竹縣", x: 781.7, y: 497.5, size: 20 },
  "miaoli-county": { text: "苗栗縣", x: 713.5, y: 547.4, size: 20 },
  "taichung-city": { text: "臺中市", x: 717.8, y: 628.1, size: 22 },
  "changhua-county": { text: "彰化縣", x: 585.8, y: 700.4, size: 20 },
  "nantou-county": { text: "南投縣", x: 731.5, y: 743.3, size: 20 },
  "yunlin-county": { text: "雲林縣", x: 579.5, y: 789.4, size: 20 },
  "chiayi-city": { text: "嘉義市", x: 585.8, y: 839.5, size: 18 },
  "chiayi-county": { text: "嘉義縣", x: 617.3, y: 861.3, size: 20 },
  "tainan-city": { text: "臺南市", x: 550.4, y: 939.9, size: 20 },
  "kaohsiung-city": { text: "高雄市", x: 627.8, y: 987, size: 22 },
  "pingtung-county": { text: "屏東縣", x: 636.9, y: 1122.1, size: 20 },
  "yilan-county": { text: "宜蘭縣", x: 914.1, y: 504.3, size: 20 },
  "hualien-county": { text: "花蓮縣", x: 835.8, y: 770.9, size: 22 },
  "taitung-county": { text: "臺東縣", x: 777.1, y: 1058.7, size: 20 },
  "penghu-county": { text: "澎湖縣", x: 337.4, y: 846.1, size: 20 },
  "kinmen-county": { text: "金門縣", x: 167.6, y: 495.2, size: 20 },
  "lienchiang-county": { text: "連江縣", x: 527.2, y: 66.7, size: 18 },
};

const mainlandLocations = computed(() =>
  taiwanMap.locations.filter((l: { id: string }) => !ISLAND_SET.has(l.id)),
);
const islandLocations = computed(() =>
  taiwanMap.locations.filter((l: { id: string }) => ISLAND_SET.has(l.id)),
);

function islandPathTransform(id: string): string {
  const cfg = ISLAND_INSET[id];
  if (!cfg) return "";
  return `translate(${cfg.tx} ${cfg.ty}) scale(${cfg.scale * ISLAND_GRAPH_SCALE_MULT}) translate(${-cfg.minX} ${-cfg.minY})`;
}

function islandTextX(id: string): number {
  const cfg = ISLAND_INSET[id];
  if (!cfg) return 0;
  const off = ISLAND_LABEL_OFFSET[id] ?? { dx: 0, dy: 0 };
  return cfg.minX + cfg.w / 2 + off.dx;
}

function islandTextY(id: string): number {
  const cfg = ISLAND_INSET[id];
  if (!cfg) return 0;
  const off = ISLAND_LABEL_OFFSET[id] ?? { dx: 0, dy: 0 };
  return cfg.minY + cfg.h / 2 + off.dy;
}

function islandTextFontSize(id: string): number {
  const cfg = ISLAND_INSET[id];
  if (!cfg) return 20;
  // 實際渲染字級會乘上 islandPathTransform 的 scale，所以做反向補償
  // 本島文字在 MAINLAND group 內會再乘上 MAINLAND_SCALE，
  // 所以離島要補償到「與本島相同的最終視覺字級」。
  const target = (TW_LABELS[id]?.size ?? 20) * MAINLAND_SCALE;
  const s = cfg.scale * ISLAND_GRAPH_SCALE_MULT;
  return target / s;
}
</script>

<template>
  <svg
    :viewBox="FULL_VIEWBOX"
    class="mx-auto block h-auto w-full max-w-none"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="臺灣22縣市地圖"
  >
    <!-- 本島（放大填滿右側） -->
    <g :transform="`translate(${MAINLAND_TX}, ${MAINLAND_TY}) scale(${MAINLAND_SCALE})`">
      <path
        v-for="loc in mainlandLocations"
        :key="loc.id"
        :d="loc.path"
        :fill="completedIds.has(loc.id) ? FILL_DONE : FILL_TODO"
        stroke="#ffffff"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
      <text
        v-for="loc in mainlandLocations"
        :key="`label-${loc.id}`"
        :x="TW_LABELS[loc.id]?.x ?? 0"
        :y="(TW_LABELS[loc.id]?.y ?? 0) + 12"
        text-anchor="middle"
        dominant-baseline="middle"
        font-weight="600"
        :font-size="TW_LABELS[loc.id]?.size ?? 20"
        fill="#5a4a73"
        stroke="#ffffff"
        stroke-width="3"
        paint-order="stroke"
      >
        {{ TW_LABELS[loc.id]?.text ?? "" }}
      </text>
    </g>

    <!-- 離島：圖形在 transform 內，文字在 transform 外（固定 viewBox 座標） -->
    <template v-for="loc in islandLocations" :key="`island-${loc.id}`">
      <g :transform="islandPathTransform(loc.id)">
        <path
          :d="loc.path"
          :fill="completedIds.has(loc.id) ? FILL_DONE : FILL_TODO"
          stroke="#ffffff"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
        <text
          :x="islandTextX(loc.id)"
          :y="islandTextY(loc.id)"
          text-anchor="middle"
          dominant-baseline="middle"
          font-weight="600"
          :font-size="islandTextFontSize(loc.id)"
          fill="#5a4a73"
          stroke="#ffffff"
          stroke-width="3"
          paint-order="stroke"
        >
          {{ TW_LABELS[loc.id]?.text ?? "" }}
        </text>
      </g>
    </template>
  </svg>
</template>
