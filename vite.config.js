import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 配置
// 如果仓库名是 username.github.io，base 设为 '/'
// 如果仓库名是其他（如 clickGame），base 设为 '/clickGame/'
const getBasePath = () => {
  // 从环境变量获取仓库名（GitHub Actions 会设置）
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1]
    // 如果是 username.github.io 格式，使用根路径
    if (repoName.includes('.github.io')) {
      return '/'
    }
    // 否则使用仓库名作为子路径
    return `/${repoName}/`
  }
  // 本地开发时，根据你的实际仓库名修改这里
  // 例如：如果仓库名是 clickGame，改为 return '/clickGame/'
  // 如果仓库名是 username.github.io，保持 return '/'
  return '/'  // 默认根路径
}

export default defineConfig({
  plugins: [react()],
  base: getBasePath(),
  build: {
    outDir: 'docs',  // GitHub Pages 使用 /docs 目录
  },
})

