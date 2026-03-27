import { Command } from 'commander'
import { createInterface } from 'node:readline'
import { loadConfig, saveConfig, getConfigPath } from '../config.js'

export const loginCommand = new Command('login')
  .description('Authenticate with your Postlark API key')
  .argument('[key]', 'API key (or enter interactively)')
  .action(async (key?: string) => {
    let apiKey = key
    if (!apiKey) {
      const rl = createInterface({ input: process.stdin, output: process.stderr })
      apiKey = await new Promise<string>((resolve) => {
        rl.question('Enter your API key (pk_live_...): ', (answer) => {
          rl.close()
          resolve(answer.trim())
        })
      })
    }
    if (!apiKey) {
      console.error('Error: No API key provided.')
      process.exit(1)
    }
    const config = loadConfig()
    config.apiKey = apiKey
    saveConfig(config)
    console.log(`API key saved to ${getConfigPath()}`)
  })
