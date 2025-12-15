import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Prevents "process is not defined" error in browser for legacy code reliance
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    host: true
  }
});