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
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Keep the shell tiny so first paint is immediate; every feature module
        // is code-split by the lazy() calls in src/modules/registry.tsx.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('motion') || id.includes('framer')) return 'motion';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react';
          if (id.includes('date-fns')) return 'date';
        },
      },
    },
  },
});
