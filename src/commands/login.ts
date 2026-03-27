import { Command } from 'commander'
import { exec } from 'node:child_process'
import { platform } from 'node:os'
import { createInterface } from 'node:readline'
import { loadConfig, saveConfig, getConfigPath } from '../config.js'

const API_BASE = 'https://api.postlark.ai/v1'

/** Open URL in default browser */
function openBrowser(url: string): void {
  const cmd = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} "${url}"`, () => {}) // fire and forget
}

/** Device auth flow: browser login + polling */
async function browserLogin(apiBase: string): Promise<void> {
  const base = apiBase || API_BASE

  // 1. Initiate device auth
  console.log('Opening browser for authentication...\n')
  const initRes = await fetch(`${base}/auth/device`, { method: 'POST' })
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({ message: 'Failed to start login' }))
    console.error(`Error: ${(err as { message: string }).message}`)
    process.exit(1)
  }
  const { device_code, user_code, verify_url, expires_in, interval } = await initRes.json() as {
    device_code: string; user_code: string; verify_url: string; expires_in: number; interval: number
  }

  // 2. Show code and open browser
  console.log(`  Your confirmation code: ${user_code}\n`)
  console.log(`  If the browser doesn't open, visit:`)
  console.log(`  ${verify_url}\n`)
  openBrowser(verify_url)

  // 3. Poll for authorization
  const pollInterval = (interval || 2) * 1000
  const deadline = Date.now() + expires_in * 1000
  process.stdout.write('  Waiting for authorization...')

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval))

    try {
      const pollRes = await fetch(`${base}/auth/device/poll?code=${device_code}`)
      if (!pollRes.ok) {
        if (pollRes.status === 404) {
          console.error('\n\nError: Code expired. Please try again.')
          process.exit(1)
        }
        continue
      }
      const data = await pollRes.json() as { status: string; token?: string; name?: string; email?: string }
      if (data.status === 'authorized' && data.token) {
        process.stdout.write(' done!\n\n')
        const config = loadConfig()
        config.apiKey = data.token
        saveConfig(config)
        console.log(`  Logged in as ${data.name} (${data.email})`)
        console.log(`  API key saved to ${getConfigPath()}`)
        return
      }
    } catch {
      // Network error, retry
    }
  }

  console.error('\n\nError: Login timed out. Please try again.')
  process.exit(1)
}

export const loginCommand = new Command('login')
  .description('Authenticate with Postlark (opens browser, or pass API key directly)')
  .argument('[key]', 'API key for direct authentication (skips browser)')
  .option('--api-base <url>', 'Override API base URL')
  .action(async (key?: string, opts?: { apiBase?: string }) => {
    if (key) {
      // Direct API key entry
      const config = loadConfig()
      config.apiKey = key
      saveConfig(config)
      console.log(`API key saved to ${getConfigPath()}`)
      return
    }

    // Browser login flow
    await browserLogin(opts?.apiBase || '')
  })
