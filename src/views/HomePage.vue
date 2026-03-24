<script setup lang="ts">
import heroImage from "../assets/images/home/heroimage.png";
import checkPlaceImage from "../assets/images/home/checkplace.png";
import checkEventImage from "../assets/images/home/checkevent.png";
import firstActionImage from "../assets/images/home/first-action.png";
import secondActionImage from "../assets/images/home/second-action.png";
import thirdActionImage from "../assets/images/home/third-action.png";

function onActionClick(action: "team" | "checkin" | "progress") {
  console.log(`[home-action] ${action}`);
}

function onCheckPlaceClick() {
  console.log("[home-action] check-place");
}

function onCheckEventClick() {
  console.log("[home-action] check-event");
}
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-linear-to-b from-[#e4d1f8] to-white text-[#333333]">
    <section class="relative px-4 pt-[max(8px,env(safe-area-inset-top))]">
      <img :src="heroImage" alt="傳聖火主視覺" class="block w-full h-auto" />
      <button
        type="button"
        aria-label="查看活動辦法"
        class="absolute right-8 top-[132px] block w-[160px] max-w-[49%] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        @click="onCheckEventClick"
      >
        <img :src="checkEventImage" alt="查看活動辦法" class="block h-auto w-full" />
      </button>
      <button
        type="button"
        aria-label="查看可打卡地點"
        class="absolute right-5 bottom-2 block w-[160px] max-w-[49%] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        @click="onCheckPlaceClick"
      >
        <img :src="checkPlaceImage" alt="查看可打卡地點" class="block h-auto w-full" />
      </button>
    </section>

    <section class="px-4 pt-[14px] pb-6">
      <button
        type="button"
        class="block w-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
        @click="onActionClick('team')"
      >
        <img
          :src="firstActionImage"
          alt="立即組隊，開啟你的逐光旅程"
          class="block h-auto w-full"
        />
      </button>

      <div class="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          class="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
          @click="onActionClick('checkin')"
        >
          <img
            :src="secondActionImage"
            alt="聖火傳遞打卡"
            class="block h-auto w-full"
          />
        </button>

        <button
          type="button"
          class="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#674598] focus-visible:ring-offset-2"
          @click="onActionClick('progress')"
        >
          <img
            :src="thirdActionImage"
            alt="查看打卡進度"
            class="block h-auto w-full"
          />
        </button>
      </div>
    </section>
  </main>
</template>
