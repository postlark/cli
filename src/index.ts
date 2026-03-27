#!/usr/bin/env node

import { Command } from 'commander'
import { setGlobalOpts } from './client.js'
import { setJsonMode } from './output.js'
import { loginCommand } from './commands/login.js'
import { logoutCommand } from './commands/logout.js'
import { whoamiCommand } from './commands/whoami.js'
import { blogsCommand } from './commands/blogs.js'
import { postsCommand } from './commands/posts.js'
import { deployCommand } from './commands/deploy.js'
import { searchCommand, discoverCommand } from './commands/search.js'
import { analyticsCommand } from './commands/analytics.js'
import { domainsCommand } from './commands/domains.js'
import { tokensCommand } from './commands/tokens.js'
import { keysCommand } from './commands/keys.js'
import { accountCommand } from './commands/account.js'
import { packsCommand } from './commands/packs.js'

const program = new Command()

program
  .name('postlark')
  .description('Postlark CLI — manage your AI-native blog from the terminal')
  .version('0.1.0')
  .option('--api-key <key>', 'Override stored API key')
  .option('--api-base <url>', 'Override API base URL')
  .option('--blog <id>', 'Override default blog ID')
  .option('--json', 'Output as JSON')
  .option('--no-color', 'Disable ANSI colors')
  .option('-v, --verbose', 'Show HTTP request details')
  .hook('preAction', (_thisCommand, actionCommand) => {
    const opts = program.opts()
    setGlobalOpts({
      apiKey: opts.apiKey,
      apiBase: opts.apiBase,
      blogId: opts.blog,
      verbose: opts.verbose,
    })
    if (opts.json) setJsonMode(true)
    // propagate to subcommands
    const sub = actionCommand.opts()
    if (sub.json) setJsonMode(true)
  })

// Auth
program.addCommand(loginCommand)
program.addCommand(logoutCommand)
program.addCommand(whoamiCommand)

// Resources
program.addCommand(blogsCommand)
program.addCommand(postsCommand)
program.addCommand(deployCommand)
program.addCommand(searchCommand)
program.addCommand(discoverCommand)
program.addCommand(analyticsCommand)
program.addCommand(domainsCommand)
program.addCommand(tokensCommand)
program.addCommand(keysCommand)
program.addCommand(accountCommand)
program.addCommand(packsCommand)

program.parseAsync().catch((err) => {
  console.error(err instanceof Error ? err.message : 'Unknown error')
  process.exit(1)
})
