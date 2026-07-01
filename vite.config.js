import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
 server: {
    allowedHosts: [
      "96b8-202-44-240-108.ngrok-free.app"
    ],
  },
  resolve: {
    alias: [
      {
        find: /^moment$/,
        replacement: fileURLToPath(
          new URL("./node_modules/moment/moment.js", import.meta.url)
        ),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },

  optimizeDeps: {
    include: ["calendarjs", "moment"],
  },
});