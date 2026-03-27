import { Command } from 'commander'
import { apiCall } from '../client.js'
import { output, error, success } from '../output.js'
import { loadConfig } from '../config.js'

function getBlogId(opts: { blog?: string }): string {
  const id = opts.blog ?? loadConfig().defaultBlog
  if (!id) error('No blog specified. Use --blog <id> or run: postlark blogs use <id>')
  return id!
}

export const domainsCommand = new Command('domains')
  .description('Manage custom domain')
  .option('--blog <id>', 'Blog ID')
  .action(async function (this: Command) {
    try {
      const blogId = getBlogId(this.opts())
      const result = await apiCall<{
        hostname: string; status: string; ssl_status: string
      }>(`/blogs/${blogId}/domain`)
      output(result, () => [
        `Domain:  ${result.hostname}`,
        `Status:  ${result.status}`,
        `SSL:     ${result.ssl_status}`,
      ].join('\n'))
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to get domain status')
    }
  })

domainsCommand
  .command('set <hostname>')
  .description('Register a custom domain (Creator+)')
  .option('--blog <id>', 'Blog ID')
  .action(async (hostname: string, opts) => {
    try {
      const blogId = getBlogId(opts)
      const result = await apiCall<{ hostname: string; status: string }>(`/blogs/${blogId}/domain`, {
        method: 'POST',
        body: { hostname },
      })
      output(result, () => `Domain "${result.hostname}" registered (${result.status}).\nAdd a CNAME record pointing to postlark.ai`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to set domain')
    }
  })

domainsCommand
  .command('remove')
  .description('Remove custom domain')
  .option('--blog <id>', 'Blog ID')
  .option('--confirm', 'Skip confirmation')
  .action(async (opts) => {
    if (!opts.confirm) error('Add --confirm to remove domain.')
    try {
      const blogId = getBlogId(opts)
      await apiCall(`/blogs/${blogId}/domain`, { method: 'DELETE' })
      success('Custom domain removed.')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to remove domain')
    }
  })
