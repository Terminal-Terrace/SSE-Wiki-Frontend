import { execSync } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

function getCurrentPackageDir() {
  // 获取当前执行脚本的包目录
  return process.cwd()
}

function hasChangesInPackage() {
  try {
    // 检查 package.json 是否有变化
    execSync(`git diff --quiet HEAD~1 HEAD -- .`, {
      stdio: 'pipe',
    })

    return false // 没有变化
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (error) {
    return true // 有变化
  }
}

function deployIfChanged() {
  const currentDir = getCurrentPackageDir()

  if (hasChangesInPackage()) {
    console.log('Changes detected, starting deployment...')
    try {
      execSync('pnpm run build && wrangler deploy', {
        stdio: 'inherit',
        cwd: currentDir,
      })
      console.log('Deployment completed successfully!')
    }
    catch (error) {
      console.error('Deployment failed:', error.message)
      process.exit(1)
    }
  }
  else {
    console.log('No changes detected, skipping deployment.')
  }
}

// 如果直接运行此脚本
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  deployIfChanged()
}

export { deployIfChanged, hasChangesInPackage }
