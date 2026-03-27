import { Command } from 'commander'
import { apiCall } from '../client.js'
import { output, error, success, table } from '../output.js'
import { loadConfig } from '../config.js'

function getBlogId(opts: { blog?: string }): string {
  const id = opts.blog ?? loadConfig().defaultBlog
  if (!id) error('No blog specified. Use --blog <id> or run: postlark blogs use <id>')
  return id!
}

export const keysCommand = new Command('keys')
  .description('Manage blog API keys')
  .option('--blog <id>', 'Blog ID')
  .action(async function (this: Command) {
    try {
      const blogId = getBlogId(this.opts())
      const result = await apiCall<{
        data: Array<{ id: string; name: string; key_prefix: string; expires_at: string | null; created_at: string }>
      }>(`/blogs/${blogId}/api-keys`)
      output(result.data, () => {
        if (result.data.length === 0) return 'No API keys found.'
        return table(
          ['Name', 'Prefix', 'Expires', 'ID'],
          result.data.map((k) => [
            k.name,
            k.key_prefix + '...',
            k.expires_at ?? 'never',
            k.id,
          ]),
        )
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to list API keys')
    }
  })

keysCommand
  .command('create')
  .description('Create a new API key')
  .requiredOption('--name <name>', 'Key name')
  .option('--blog <id>', 'Blog ID')
  .option('--expires-in <duration>', 'Expiration (e.g. 30d, 90d)')
  .action(async (opts) => {
    try {
      const blogId = getBlogId(opts)
      const result = await apiCall<{ id: string; key: string; name: string }>(`/blogs/${blogId}/api-keys`, {
        method: 'POST',
        body: { name: opts.name, expires_in: opts.expiresIn },
      })
      output(result, () => [
        `API key created: ${result.name}`,
        `ID:  ${result.id}`,
        `Key: ${result.key}`,
        '',
        'Save this key now — it will not be shown again.',
      ].join('\n'))
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to create API key')
    }
  })

keysCommand
  .command('revoke <keyId>')
  .description('Revoke an API key')
  .option('--blog <id>', 'Blog ID')
  .option('--confirm', 'Skip confirmation')
  .action(async (keyId: string, opts) => {
    if (!opts.confirm) error('Add --confirm to revoke this key.')
    try {
      const blogId = getBlogId(opts)
      await apiCall(`/blogs/${blogId}/api-keys/${keyId}`, { method: 'DELETE' })
      success(`API key ${keyId} revoked.`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to revoke API key')
    }
  })
