import { Command } from 'commander'
import { apiCall } from '../client.js'
import { output, error } from '../output.js'

export const searchCommand = new Command('search')
  .description('Search posts on your blog (full-text)')
  .argument('<query>', 'Search query')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Items per page', '20')
  .action(async (query: string, opts) => {
    try {
      const params = new URLSearchParams({ q: query, page: opts.page, per_page: opts.perPage })
      const result = await apiCall<{
        data: Array<{ slug: string; title: string; meta_description: string; tags: string[] }>
        pagination: { total: number; page: number; total_pages: number }
      }>(`/search?${params}`)
      output(result, () => {
        if (result.data.length === 0) return `No results for "${query}".`
        const lines = result.data.map((p) =>
          `  ${p.title} (/${p.slug})${p.tags.length ? ` [${p.tags.join(', ')}]` : ''}\n    ${p.meta_description || '(no description)'}`)
        return `${result.pagination.total} results (page ${result.pagination.page}/${result.pagination.total_pages})\n\n${lines.join('\n')}`
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Search failed')
    }
  })

export const discoverCommand = new Command('discover')
  .description('Discover posts across all Postlark blogs (no auth needed)')
  .argument('<query>', 'Search query')
  .option('--tag <tag>', 'Filter by tag')
  .option('--page <n>', 'Page number', '1')
  .option('--per-page <n>', 'Items per page', '20')
  .action(async (query: string, opts) => {
    try {
      const params = new URLSearchParams({ q: query, page: opts.page, per_page: opts.perPage })
      if (opts.tag) params.set('tag', opts.tag)
      const result = await apiCall<{
        data: Array<{
          title: string; slug: string; excerpt: string; tags: string[]
          blog_name: string; url: string; llms_txt_url: string | null
        }>
        pagination: { total: number; page: number; total_pages: number }
      }>(`/discover?${params}`, { public: true })
      output(result, () => {
        if (result.data.length === 0) return `No posts found for "${query}".`
        const lines = result.data.map((p) => {
          const parts = [`  ${p.title} (${p.blog_name})`, `    ${p.url}`]
          if (p.excerpt) parts.push(`    ${p.excerpt}`)
          if (p.tags.length) parts.push(`    Tags: ${p.tags.join(', ')}`)
          return parts.join('\n')
        })
        return `${result.pagination.total} posts found (page ${result.pagination.page}/${result.pagination.total_pages})\n\n${lines.join('\n')}`
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Discovery failed')
    }
  })
