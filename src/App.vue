<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getEndpointConfig } from "./config/endpoint";
import { liffService } from "./services/liffService";
import HomePage from "./views/HomePage.vue";

const endpoint = getEndpointConfig();
const userId = ref<string>("");

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
  <HomePage />
</template>
