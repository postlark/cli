import { Command } from 'commander'
import { apiCall } from '../client.js'
import { output, error } from '../output.js'
import { loadConfig } from '../config.js'

export const whoamiCommand = new Command('whoami')
  .description('Show current user profile and plan')
  .action(async () => {
    try {
      const profile = await apiCall<{
        id: string; email: string; name: string; plan: string; created_at: string
      }>('/account/profile')
      const config = loadConfig()
      output(profile, () => [
        `User:  ${profile.name} (${profile.email})`,
        `Plan:  ${profile.plan}`,
        `ID:    ${profile.id}`,
        config.defaultBlog ? `Blog:  ${config.defaultBlog}` : null,
      ].filter(Boolean).join('\n'))
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to fetch profile')
    }
  })
