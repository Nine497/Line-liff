import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],

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