import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['Firefox >= 48', 'Chrome >= 53'], // KaiOS 2.5 is based on Firefox 48
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  build: {
    target: 'es2015', // Good base target for older browsers
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});
