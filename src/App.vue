<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getEndpointConfig } from "./config/endpoint";
import { liffService } from "./services/liffService";
import HomePage from "./views/HomePage.vue";
import CheckPlacePage from "./views/CheckPlacePage.vue";
import CheckEventPage from "./views/CheckEventPage.vue";

const endpoint = getEndpointConfig();
const userId = ref<string>("");
const currentView = ref<"home" | "checkPlace" | "checkEvent">("home");

function openCheckPlace() {
  currentView.value = "checkPlace";
}

function openCheckEvent() {
  currentView.value = "checkEvent";
}

function backToHome() {
  currentView.value = "home";
}

onMounted(async () => {
  try {
    await liffService.ensureLogin();
    userId.value = await liffService.getUserId();
  } catch (error) {
    userId.value = endpoint.testUserId;
    if (endpoint.debug) {
      console.error(error);
    }
  }
});
</script>

<template>
  <HomePage
    v-if="currentView === 'home'"
    @open-check-place="openCheckPlace"
    @open-check-event="openCheckEvent"
  />
  <CheckPlacePage v-else-if="currentView === 'checkPlace'" @back="backToHome" />
  <CheckEventPage v-else @back="backToHome" />
</template>
