import { Command } from 'commander'
import { writeFileSync } from 'node:fs'
import { apiCall } from '../client.js'
import { output, error, success } from '../output.js'

export const accountCommand = new Command('account')
  .description('Account management')
  .action(async () => {
    try {
      const profile = await apiCall<{
        id: string; email: string; name: string; plan: string; created_at: string
      }>('/account/profile')
      output(profile, () => [
        `Name:    ${profile.name}`,
        `Email:   ${profile.email}`,
        `Plan:    ${profile.plan}`,
        `ID:      ${profile.id}`,
        `Created: ${profile.created_at}`,
      ].join('\n'))
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to fetch profile')
    }
  })

accountCommand
  .command('export')
  .description('Export all your data as JSON (GDPR)')
  .option('--output <path>', 'Save to file (default: stdout)')
  .action(async (opts) => {
    try {
      const data = await apiCall<unknown>('/account/export')
      if (opts.output) {
        writeFileSync(opts.output, JSON.stringify(data, null, 2))
        success(`Data exported to ${opts.output}`)
      } else {
        output(data)
      }
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to export data')
    }
  })

accountCommand
  .command('delete')
  .description('Delete your account permanently (GDPR)')
  .requiredOption('--confirm <phrase>', 'Type "DELETE MY ACCOUNT" to confirm')
  .action(async (opts) => {
    if (opts.confirm !== 'DELETE MY ACCOUNT') {
      error('You must type exactly: --confirm "DELETE MY ACCOUNT"')
    }
    try {
      await apiCall('/account/delete', { method: 'POST' })
      success('Account deleted. All data has been removed.')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to delete account')
    }
  })
