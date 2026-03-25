<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const teamId = computed(() => {
  const q = route.query.team_id;
  return typeof q === "string" ? q : Array.isArray(q) ? q[0] ?? "" : "";
});

function goHome() {
  router.push({ name: "home" });
}
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-[#f5f1f7] px-4 pt-[max(12px,env(safe-area-inset-top))] pb-8 text-[#333]">
    <header class="relative flex items-center justify-center py-2">
      <button
        type="button"
        aria-label="返回首頁"
        class="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-[28px] leading-none"
        @click="goHome"
      >
        ‹
      </button>
      <h1 class="text-[20px] font-bold leading-none">加入隊伍</h1>
    </header>

    <section class="mt-6 rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
      <p class="text-[15px] leading-relaxed text-[#444]">
        您正透過邀請連結加入隊伍。
        <span v-if="teamId" class="mt-2 block font-mono text-[13px] text-[#674598]">team_id：{{ teamId }}</span>
        <span v-else class="mt-2 block text-[14px] text-[#a40000]">連結缺少 team_id 參數。</span>
      </p>
      <p class="mt-4 text-[13px] text-[#666]">後續將在此呼叫 POST /api/check-in/teams/join 完成加入流程。</p>
      <button
        type="button"
        class="mt-6 w-full rounded-full bg-linear-to-r from-[#674598] to-[#bca9d1] py-3 text-[16px] font-bold text-white"
        @click="goHome"
      >
        回首頁
      </button>
    </section>
  </main>
</template>
