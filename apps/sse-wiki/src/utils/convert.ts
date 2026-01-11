/**
 * 将 BFF 返回的 snake_case 转换为前端的 camelCase
 *
 * 这是临时方案，用于在 BFF 层重构前进行字段名转换
 * 未来 BFF 层重构为 camelCase 后，可以删除此函数
 *
 * @param data BFF 返回的 snake_case 数据
 * @returns 转换后的 camelCase 数据
 */
export function toCamelCase<T = any>(data: any): T {
  if (!data || typeof data !== 'object') {
    return data as T
  }

  if (Array.isArray(data)) {
    return data.map(item => toCamelCase(item)) as T
  }

  const result: any = {}

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = toCamelCase(data[key])
    }
  }

  if (data.currentVersion?.author) {
    result.editor = {
      id: data.currentVersion.author.id,
      username: data.currentVersion.author.username,
    }
  }
  else if (data.author) {
    result.editor = {
      id: data.author.id,
      username: data.author.username,
    }
  }

  return result as T
}

/**
 * 将前端的 camelCase 转换为后端需要的 snake_case
 * 用于请求参数转换
 *
 * @param data 前端的 camelCase 数据
 * @returns 转换后的 snake_case 数据
 */
export function toSnakeCase<T = any>(data: any): T {
  if (!data || typeof data !== 'object') {
    return data as T
  }

  if (Array.isArray(data)) {
    return data.map(item => toSnakeCase(item)) as T
  }

  const result: any = {}

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = toSnakeCase(data[key])
    }
    else {
      result[key] = toSnakeCase(data[key])
    }
  }

  return result as T
}
