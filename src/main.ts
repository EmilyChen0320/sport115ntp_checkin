import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import { liffService } from "./services/liffService";
import "./styles/tailwind.css";

async function bootstrap() {
  try {
    await liffService.init();
  } catch {
    // init 失敗由各頁面自行處理
  }

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.mount("#app");
}

void bootstrap();
