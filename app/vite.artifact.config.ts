/**
 * Single-file build for publishing as a claude.ai Artifact.
 * Artifacts run under a strict CSP (no external requests), so everything —
 * every lazy view, all CSS — must collapse into one inline bundle.
 * Usage: npx vite build --config vite.artifact.config.ts
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist-artifact',
    cssCodeSplit: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
