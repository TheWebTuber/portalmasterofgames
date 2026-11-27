import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    license: { fileName: "THIRD-PARTY-LICENSES.txt" },
    assetsDir: "",
    outDir: "site",
    lib: {
      entry: "src/main.tsx",
      formats: ["iife"],
      name: "CharacterForge",
      fileName: () => "forge.js",
      cssFileName: "forge",
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
