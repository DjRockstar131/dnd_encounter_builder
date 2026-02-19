import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/dnd_encounter_builder/",
  build: {
    outDir: "docs",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        monsters: resolve(__dirname, "monsters.html"),
        encounters: resolve(__dirname, "encounters.html"),
      },
    },
  },
});
