import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const widgetName = "your-ai-council";

export default defineConfig({
  root: resolve(__dirname, "src", widgetName),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "assets"),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: `${widgetName}-[hash].js`,
        chunkFileNames: `${widgetName}-[hash].js`,
        assetFileNames: `${widgetName}-[hash][extname]`,
      },
    },
  },
});

