import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  root: 'apps/web', plugins: [react()],
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:3001' } },
  build: { outDir: '../../dist/client', emptyOutDir: true, rollupOptions:{output:{manualChunks(id){
    if(id.includes('node_modules')){
      if(id.includes('recharts')||id.includes('d3-')||id.includes('victory'))return 'charts';
      if(id.includes('framer-motion')||id.includes('motion-dom')||id.includes('motion-utils'))return 'motion';
      if(id.includes('@radix-ui'))return 'accessible-ui';
      if(id.includes('zod'))return 'validation';
      return 'vendor';
    }
  }}} }
});
