export async function calculateFileSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const bytes = new Uint8Array(hashBuffer)
  let hex = ''
  for (const b of bytes)
    hex += b.toString(16).padStart(2, '0')
  return hex
}
