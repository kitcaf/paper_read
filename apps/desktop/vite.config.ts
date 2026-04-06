import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../..", "");

  return {
    envDir: "../..",
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.WEB_PORT ?? 5173)
    }
  };
});
