import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowed = (env.VITE_ALLOWED_HOSTS || '.e2b.dev,localhost,127.0.0.1')
    .split(',').map(s => s.trim()).filter(Boolean);
  
  return {
    base: env.VITE_BASE || '/',
    server: { 
      host: true, 
      allowedHosts: allowed 
    },
    preview: { 
      host: true, 
      allowedHosts: allowed 
    }
  };
});