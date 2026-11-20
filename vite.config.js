import { defineConfig } from "vite";
// base "./" lets the built site run from any folder: GitHub Pages, Netlify, or a USB stick.
export default defineConfig({ base: "./", build: { outDir: "dist", assetsInlineLimit: 0 } });
