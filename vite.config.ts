import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET?.trim();

  return {
    base: "/liff/check_in/index/",
    plugins: [vue()],
    publicDir: "public",
    server: {
      ...(proxyTarget
        ? {
            proxy: {
              "/api": {
                target: proxyTarget,
                changeOrigin: true,
              },
            },
          }
        : {}),
    },
    build: {
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name ?? "";
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(name)) {
              return "assets/images/[name]-[hash][extname]";
            }
            if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) {
              return "assets/fonts/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
        },
      },
    },
  };
});
