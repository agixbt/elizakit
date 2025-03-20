import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.browser': true,
    'process.version': JSON.stringify(process.version),
    'process': {
      env: {},
      browser: true,
      version: JSON.stringify(process.version)
    }
  }
});