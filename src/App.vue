<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import { getEndpointConfig } from "./config/endpoint";
import { liffService } from "./services/liffService";

const endpoint = getEndpointConfig();
const isFriend = ref(true);
const addFriendUrl = ref("");
const checking = ref(true);

async function checkAndSetFriendship() {
  const result = await liffService.checkFriendship();
  isFriend.value = result;
  if (!result) {
    addFriendUrl.value = liffService.getAddFriendUrl();
  }
}

function openAddFriend() {
  if (addFriendUrl.value) {
    window.open(addFriendUrl.value, "_blank");
  }
}

async function recheckFriendship() {
  const result = await liffService.checkFriendship();
  isFriend.value = result;
}

onMounted(async () => {
  try {
    await liffService.ensureLogin();
    await checkAndSetFriendship();
  } catch (error) {
    if (endpoint.debug) {
      console.error(error);
    }
  } finally {
    checking.value = false;
  }
});
</script>

<template>
  <div v-if="checking" class="flex min-h-screen items-center justify-center bg-[#f5f1f7]">
    <p class="text-[14px] text-[#666]">載入中…</p>
  </div>

  <div
    v-else-if="!isFriend"
    class="mx-auto flex min-h-screen w-full max-w-[393px] flex-col items-center justify-center bg-[#f5f1f7] px-6 text-center"
  >
    <div class="rounded-2xl bg-white px-6 py-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <p class="text-[22px] font-extrabold text-[#222]">請先加入好友</p>
      <p class="mt-3 text-[14px] leading-6 text-[#555]">
        使用本活動功能前，請先將官方帳號加為好友，以便我們取得您的基本資料。
      </p>
      <button
        type="button"
        class="mt-6 w-full rounded-full bg-[#06C755] py-3 text-[16px] font-bold text-white transition active:scale-[0.98] active:opacity-90"
        @click="openAddFriend"
      >
        加入好友
      </button>
      <button
        type="button"
        class="mt-3 w-full rounded-full border border-[#674598] py-3 text-[15px] font-bold text-[#674598] transition active:scale-[0.98] active:opacity-90"
        @click="recheckFriendship"
      >
        我已加入，重新檢查
      </button>
    </div>
  </div>

  <RouterView v-else />
</template>
