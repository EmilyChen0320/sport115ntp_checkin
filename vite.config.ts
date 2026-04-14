import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET?.trim();
  const isBuild = command === "build";

  return {
    // LIFF requires the current URL to stay under this endpoint path.
    base: isBuild ? "/liff/check_in/index/" : "/",
    plugins: [vue()],
    publicDir: "public",
    experimental: {
      renderBuiltUrl(filename, { type }) {
        // Keep emitted images at /images/... while app routes stay under /liff/check_in/index/.
        if (type === "asset" && filename.startsWith("images/sport115ntp/check_in/")) {
          return `/${filename}`;
        }
        return { relative: true };
      },
    },
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
