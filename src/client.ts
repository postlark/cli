import { apiCall as sharedApiCall, type ApiCallOptions } from '@postlark/shared'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadConfig } from './config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'))
const VERSION = pkg.version as string

export interface ClientOptions {
  apiKey?: string
  apiBase?: string
  blogId?: string
  verbose?: boolean
}

let globalOpts: ClientOptions = {}

export function setGlobalOpts(opts: ClientOptions): void {
  globalOpts = opts
}

export function apiCall<T>(
  path: string,
  opts: Omit<ApiCallOptions, 'apiKey' | 'apiBase' | 'userAgent'> = {},
): Promise<T> {
  const config = loadConfig()
  const apiKey = globalOpts.apiKey ?? config.apiKey
  const apiBase = globalOpts.apiBase ?? config.apiBase
  const blogId = opts.blogId ?? globalOpts.blogId ?? config.defaultBlog

  if (globalOpts.verbose) {
    const method = opts.method ?? 'GET'
    const base = apiBase ?? 'https://api.postlark.ai/v1'
    console.error(`  ${method} ${base}${path}`)
  }

  return sharedApiCall<T>(path, {
    ...opts,
    blogId,
    apiKey,
    apiBase,
    userAgent: `postlark-cli/${VERSION}`,
  })
}
