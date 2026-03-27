import { Command } from 'commander'
import { apiCall } from '../client.js'
import { output, error, table } from '../output.js'

export const analyticsCommand = new Command('analytics')
  .description('Blog analytics (Starter+)')
  .option('--period <period>', 'Time period: 7d, 30d, 90d', '30d')
  .action(async (opts) => {
    try {
      const result = await apiCall<{
        total_views: number
        daily: Array<{ date: string; views: number }>
        top_posts: Array<{ slug: string; title: string; views: number }>
      }>(`/analytics/overview?period=${opts.period}`)
      output(result, () => {
        const lines = [`Total views (${opts.period}): ${result.total_views}`, '']
        if (result.top_posts.length) {
          lines.push('Top Posts:')
          lines.push(table(
            ['Views', 'Title', 'Slug'],
            result.top_posts.map((p) => [String(p.views), p.title, `/${p.slug}`]),
          ))
        }
        return lines.join('\n')
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to fetch analytics')
    }
  })

analyticsCommand
  .command('post <slug>')
  .description('Per-post analytics')
  .action(async (slug: string) => {
    try {
      const result = await apiCall<{
        slug: string; title: string; total_views: number
        daily: Array<{ date: string; views: number }>
      }>(`/analytics/posts/${slug}`)
      output(result, () => {
        const lines = [`"${result.title}" (/${result.slug})`, `Total views: ${result.total_views}`, '']
        if (result.daily.length) {
          lines.push(table(
            ['Date', 'Views'],
            result.daily.map((d) => [d.date, String(d.views)]),
          ))
        }
        return lines.join('\n')
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to fetch post analytics')
    }
  })
