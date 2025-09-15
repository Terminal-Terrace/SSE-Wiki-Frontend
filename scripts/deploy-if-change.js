import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

function getCurrentPackageDir() {
  // 获取当前执行脚本的包目录
  return process.cwd()
}

function getPackageName() {
  try {
    const packageJsonPath = join(getCurrentPackageDir(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    return packageJson.name
  }
  catch (error) {
    console.warn('Could not read package.json:', error.message)
    return null
  }
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
  const packageName = getPackageName()

  // 检查包名是否为 template
  if (packageName === 'template') {
    console.log('Package name is "template", skipping deployment.')
    return
  }

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

export { deployIfChanged, getPackageName, hasChangesInPackage }
