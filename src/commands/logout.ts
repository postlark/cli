import { Command } from 'commander'
import { deleteConfig, getConfigPath } from '../config.js'

export const logoutCommand = new Command('logout')
  .description('Remove stored API key')
  .action(() => {
    deleteConfig()
    console.log(`Credentials removed from ${getConfigPath()}`)
  })
