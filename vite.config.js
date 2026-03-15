import { defineConfig } from 'vite';

export default defineConfig({
  // 设置为相对路径，这样部署到 GitHub Pages 的子路径下也能正常访问
  base: './',
  build: {
    outDir: 'dist',
  },
  publicDir: 'public'
});
