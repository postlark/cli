import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'

export interface PostlarkConfig {
  apiKey?: string
  defaultBlog?: string
  apiBase?: string
}

const CONFIG_PATH = join(homedir(), '.postlarkrc')

export function loadConfig(): PostlarkConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as PostlarkConfig
  } catch {
    return {}
  }
}

export function saveConfig(config: PostlarkConfig): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 })
}

export function deleteConfig(): void {
  try {
    unlinkSync(CONFIG_PATH)
  } catch {
    // ignore if doesn't exist
  }
}

export function getConfigPath(): string {
  return CONFIG_PATH
}
