import { Command } from 'commander'
import { apiCall } from '../client.js'
import { output, error, success, table } from '../output.js'
import { loadConfig, saveConfig } from '../config.js'

interface Blog {
  id: string; slug: string; name: string; description: string; custom_domain: string | null
}

export const blogsCommand = new Command('blogs')
  .description('Manage blogs')
  .action(async () => {
    // Default action: list blogs
    try {
      const result = await apiCall<{ data: Blog[] }>('/blogs')
      const config = loadConfig()
      output(result.data, () => {
        if (result.data.length === 0) return 'No blogs found. Create one with: postlark blogs create'
        return table(
          ['Name', 'Slug', 'Domain', 'ID', ''],
          result.data.map((b) => [
            b.name,
            b.slug,
            b.custom_domain ?? '-',
            b.id,
            b.id === config.defaultBlog ? '(default)' : '',
          ]),
        )
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to list blogs')
    }
  })

blogsCommand
  .command('create')
  .description('Create a new blog')
  .requiredOption('--slug <slug>', 'Blog subdomain slug')
  .requiredOption('--name <name>', 'Blog display name')
  .option('--desc <description>', 'Blog description')
  .action(async (opts) => {
    try {
      const result = await apiCall<{ id: string; slug: string; name: string }>('/blogs', {
        method: 'POST',
        body: { slug: opts.slug, name: opts.name, description: opts.desc },
      })
      output(result, () => `Blog created: ${result.name} (${result.slug})\nID: ${result.id}`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to create blog')
    }
  })

blogsCommand
  .command('update <id>')
  .description('Update blog settings')
  .option('--name <name>', 'New display name')
  .option('--desc <description>', 'New description')
  .action(async (id: string, opts) => {
    try {
      const body: Record<string, string> = {}
      if (opts.name) body.name = opts.name
      if (opts.desc) body.description = opts.desc
      await apiCall(`/blogs/${id}`, { method: 'PUT', body })
      success(`Blog ${id} updated.`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to update blog')
    }
  })

blogsCommand
  .command('delete <id>')
  .description('Delete a blog permanently')
  .option('--confirm', 'Skip confirmation')
  .action(async (id: string, opts) => {
    if (!opts.confirm) {
      error('Add --confirm to delete permanently. This cannot be undone.')
    }
    try {
      await apiCall(`/blogs/${id}`, { method: 'DELETE' })
      success(`Blog ${id} deleted.`)
      // Clear default blog if it was the deleted one
      const config = loadConfig()
      if (config.defaultBlog === id) {
        config.defaultBlog = undefined
        saveConfig(config)
      }
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to delete blog')
    }
  })

blogsCommand
  .command('use <id>')
  .description('Set default blog for all commands')
  .action(async (id: string) => {
    try {
      // Verify the blog exists
      const result = await apiCall<{ data: Blog[] }>('/blogs')
      const blog = result.data.find((b) => b.id === id || b.slug === id)
      if (!blog) {
        error(`Blog "${id}" not found. Run: postlark blogs`)
      }
      const config = loadConfig()
      config.defaultBlog = blog!.id
      saveConfig(config)
      success(`Default blog set to "${blog!.name}" (${blog!.slug})\nID: ${blog!.id}`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to set default blog')
    }
  })
