import { Command } from 'commander'
import { apiCall } from '../client.js'
import { output, error, success, table } from '../output.js'

export const tokensCommand = new Command('tokens')
  .description('Manage scoped access tokens')
  .action(async () => {
    try {
      const result = await apiCall<{
        data: Array<{ id: string; name: string; scopes: string[]; blog_id: string | null; expires_at: string | null; created_at: string }>
      }>('/account/tokens')
      output(result.data, () => {
        if (result.data.length === 0) return 'No tokens found.'
        return table(
          ['Name', 'Scopes', 'Blog', 'Expires', 'ID'],
          result.data.map((t) => [
            t.name,
            t.scopes.join(', '),
            t.blog_id ?? 'all',
            t.expires_at ?? 'never',
            t.id,
          ]),
        )
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to list tokens')
    }
  })

tokensCommand
  .command('create')
  .description('Create a scoped access token')
  .requiredOption('--name <name>', 'Token name')
  .requiredOption('--scopes <scopes>', 'Comma-separated scopes (e.g. posts:read,posts:write)')
  .option('--blog <id>', 'Bind to specific blog')
  .option('--expires-in <duration>', 'Expiration (e.g. 30d, 90d, 1y)')
  .action(async (opts) => {
    try {
      const scopes = opts.scopes.split(',').map((s: string) => s.trim())
      const result = await apiCall<{ id: string; token: string; name: string }>('/account/tokens', {
        method: 'POST',
        body: {
          name: opts.name,
          scopes,
          blog_id: opts.blog,
          expires_in: opts.expiresIn,
        },
      })
      output(result, () => [
        `Token created: ${result.name}`,
        `ID:    ${result.id}`,
        `Token: ${result.token}`,
        '',
        'Save this token now — it will not be shown again.',
      ].join('\n'))
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to create token')
    }
  })

tokensCommand
  .command('revoke <id>')
  .description('Revoke an access token')
  .option('--confirm', 'Skip confirmation')
  .action(async (id: string, opts) => {
    if (!opts.confirm) error('Add --confirm to revoke this token.')
    try {
      await apiCall(`/account/tokens/${id}`, { method: 'DELETE' })
      success(`Token ${id} revoked.`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to revoke token')
    }
  })
