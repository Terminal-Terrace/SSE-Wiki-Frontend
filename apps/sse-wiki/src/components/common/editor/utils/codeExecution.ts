/**
 * 代码执行工具函数
 */
export interface CodeExecutionResult {
  success: boolean
  output: string
  error?: string
}

/**
 * 执行 JavaScript 代码（使用 Function 构造函数创建安全的执行环境）
 */
export async function executeJavaScript(code: string): Promise<CodeExecutionResult> {
  try {
    // 创建一个安全的执行环境
    // eslint-disable-next-line no-new-func
    const fn = new Function(`
      const console = {
        log: (...args) => {
          output.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        },
        error: (...args) => {
          output.push('ERROR: ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        },
        warn: (...args) => {
          output.push('WARN: ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        }
      };
      const output = [];
      try {
        ${code}
      } catch (e) {
        output.push('Error: ' + e.message);
      }
      return output.join('\\n');
    `)

    const output = fn()
    return {
      success: true,
      output: output || '(无输出)',
    }
  }
  catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}

/**
 * 执行 Python 代码（需要后端 API 支持）
 */
export async function executePython(_code: string): Promise<CodeExecutionResult> {
  // TODO: 实现 Python 代码执行（需要后端支持）
  // 这里可以使用 API 调用后端服务来执行 Python 代码
  return {
    success: false,
    output: '',
    error: 'Python 代码执行功能需要后端支持，当前暂未实现',
  }
}

/**
 * 根据语言执行代码
 */
export async function executeCodeByLanguage(
  code: string,
  language: string,
): Promise<CodeExecutionResult> {
  const normalizedLang = language.toLowerCase()

  switch (normalizedLang) {
    case 'javascript':
    case 'js':
      return executeJavaScript(code)
    case 'python':
    case 'py':
      return executePython(code)
    default:
      return {
        success: false,
        output: '',
        error: `不支持的语言: ${language}`,
      }
  }
}
