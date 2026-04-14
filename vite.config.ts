import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET?.trim();
  const isBuild = command === "build";

  return {
    base: isBuild ? "/images/sport115ntp/check_in/" : "/",
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
              return "images/sport115ntp/check_in/[name]-[hash][extname]";
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
