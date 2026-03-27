/** Simple table formatter — no dependencies */
export function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)),
  )
  const sep = widths.map((w) => '-'.repeat(w)).join('  ')
  const head = headers.map((h, i) => h.padEnd(widths[i])).join('  ')
  const body = rows.map((r) => r.map((c, i) => (c ?? '').padEnd(widths[i])).join('  ')).join('\n')
  return `${head}\n${sep}\n${body}`
}

let jsonMode = false

export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled
}

export function isJsonMode(): boolean {
  return jsonMode
}

/** Output data — JSON mode outputs raw JSON, otherwise formats with formatter */
export function output(data: unknown, formatter?: () => string): void {
  if (jsonMode) {
    console.log(JSON.stringify(data, null, 2))
  } else if (formatter) {
    console.log(formatter())
  } else {
    console.log(data)
  }
}

export function error(message: string): void {
  console.error(`Error: ${message}`)
  process.exit(1)
}

export function success(message: string): void {
  if (!jsonMode) {
    console.log(message)
  }
}
