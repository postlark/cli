import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { apiCall } from '../client.js'
import { output, error, success, table } from '../output.js'

interface Post {
  title: string; slug: string; status: string; tags: string[]
  created_at: string; content_md?: string; meta_description?: string
}
interface PostList {
  data: Post[]
  pagination: { total: number; page: number; total_pages: number }
}

export const postsCommand = new Command('posts')
  .description('Manage blog posts')
  .option('--status <status>', 'Filter: draft, published, scheduled')
  .option('--tag <tag>', 'Filter by tag')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Items per page', '20')
  .action(async (opts) => {
    try {
      const params = new URLSearchParams()
      if (opts.status) params.set('status', opts.status)
      if (opts.tag) params.set('tag', opts.tag)
      params.set('page', opts.page)
      params.set('per_page', opts.perPage)
      const result = await apiCall<PostList>(`/posts?${params}`)
      output(result, () => {
        if (result.data.length === 0) return 'No posts found.'
        const rows = result.data.map((p) => [
          p.status,
          p.title,
          `/${p.slug}`,
          p.tags.join(', ') || '-',
        ])
        return `${result.pagination.total} posts (page ${result.pagination.page}/${result.pagination.total_pages})\n\n` +
          table(['Status', 'Title', 'Slug', 'Tags'], rows)
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to list posts')
    }
  })

postsCommand
  .command('create')
  .description('Create a new post')
  .requiredOption('--title <title>', 'Post title')
  .option('--content <markdown>', 'Markdown content (inline)')
  .option('--file <path>', 'Read content from .md file')
  .option('--slug <slug>', 'URL slug (auto-generated if omitted)')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--status <status>', 'draft or published', 'published')
  .action(async (opts) => {
    try {
      let content = opts.content
      if (opts.file) {
        content = readFileSync(opts.file, 'utf-8')
      }
      if (!content) {
        error('Provide --content or --file')
      }
      const tags = opts.tags ? opts.tags.split(',').map((t: string) => t.trim()) : undefined
      const result = await apiCall<{ slug: string; url: string; status: string }>('/posts', {
        method: 'POST',
        body: { title: opts.title, content, slug: opts.slug, tags, status: opts.status },
      })
      output(result, () => `Post created: ${result.url}\nSlug: ${result.slug}\nStatus: ${result.status}`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to create post')
    }
  })

postsCommand
  .command('get <slug>')
  .description('Get a post with full Markdown content')
  .action(async (slug: string) => {
    try {
      const post = await apiCall<Post & { content_md: string; id: string; created_at: string }>(`/posts/${slug}`)
      output(post, () => [
        `Title:   ${post.title}`,
        `Slug:    /${post.slug}`,
        `Status:  ${post.status}`,
        `Tags:    ${post.tags?.join(', ') || 'none'}`,
        `Created: ${post.created_at}`,
        '',
        '--- Content (Markdown) ---',
        post.content_md,
      ].join('\n'))
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to get post')
    }
  })

postsCommand
  .command('update <slug>')
  .description('Update an existing post')
  .option('--title <title>', 'New title')
  .option('--content <markdown>', 'New content (inline)')
  .option('--file <path>', 'Read new content from .md file')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(async (slug: string, opts) => {
    try {
      const body: Record<string, unknown> = {}
      if (opts.title) body.title = opts.title
      if (opts.file) body.content = readFileSync(opts.file, 'utf-8')
      else if (opts.content) body.content = opts.content
      if (opts.tags) body.tags = opts.tags.split(',').map((t: string) => t.trim())
      if (Object.keys(body).length === 0) {
        error('Provide at least one field to update (--title, --content, --file, --tags)')
      }
      await apiCall(`/posts/${slug}`, { method: 'PUT', body })
      success(`Post "/${slug}" updated.`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to update post')
    }
  })

postsCommand
  .command('delete <slug>')
  .description('Delete a post permanently')
  .option('--confirm', 'Skip confirmation')
  .action(async (slug: string, opts) => {
    if (!opts.confirm) {
      error('Add --confirm to delete permanently.')
    }
    try {
      await apiCall(`/posts/${slug}`, { method: 'DELETE' })
      success(`Post "/${slug}" deleted.`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to delete post')
    }
  })

postsCommand
  .command('publish <slug>')
  .description('Publish a draft post')
  .action(async (slug: string) => {
    try {
      await apiCall(`/posts/${slug}/publish`, { method: 'POST' })
      success(`Post "/${slug}" published.`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to publish post')
    }
  })

postsCommand
  .command('schedule <slug>')
  .description('Schedule a post for future publication (Creator+)')
  .requiredOption('--at <datetime>', 'ISO 8601 datetime (e.g. 2026-04-01T09:00:00Z)')
  .action(async (slug: string, opts) => {
    try {
      const result = await apiCall<{ slug: string; scheduled_at: string }>(`/posts/${slug}/schedule`, {
        method: 'POST',
        body: { scheduled_at: opts.at },
      })
      output(result, () => `Post "/${result.slug}" scheduled for ${result.scheduled_at}`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to schedule post')
    }
  })
