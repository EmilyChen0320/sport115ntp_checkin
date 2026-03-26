<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter, RouterView } from "vue-router";
import { getEndpointConfig } from "./config/endpoint";
import { liffService } from "./services/liffService";

const endpoint = getEndpointConfig();
const router = useRouter();

onMounted(async () => {
  await router.isReady();
  try {
    await liffService.ensureLogin();
  } catch (error) {
    if (endpoint.debug) {
      console.error(error);
    }
  }
});
</script>

<template>
  <RouterView />
</template>
