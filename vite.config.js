import { defineConfig } from 'vite';

export default defineConfig({
  // 设置为 GitHub 仓库路径，确保资源路径在 GitHub Pages 下正确解析
  base: '/yezi/',
  build: {
    outDir: 'dist',
  },
  publicDir: 'public'
});
