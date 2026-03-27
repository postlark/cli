import { Command } from 'commander'
import { apiCall } from '../client.js'
import { output, error, table } from '../output.js'

export const analyticsCommand = new Command('analytics')
  .description('Blog analytics (Starter+)')
  .option('--period <period>', 'Time period: 7d, 30d, 90d', '30d')
  .action(async (opts) => {
    try {
      const result = await apiCall<{
        total_views_7d: number
        total_views_30d: number
        total_uv_7d: number
        total_uv_30d: number
        daily_views: Array<{ date: string; views: number; uv: number }>
        top_posts: Array<{ slug: string; title: string; views: number }>
      }>(`/analytics/overview?period=${opts.period}`)
      output(result, () => {
        const lines = [
          `Views (7d): ${result.total_views_7d}  |  Views (30d): ${result.total_views_30d}`,
          `UV    (7d): ${result.total_uv_7d}  |  UV    (30d): ${result.total_uv_30d}`,
          '',
        ]
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
        slug: string; views_7d: number; views_30d: number
        daily_views: Array<{ date: string; views: number }>
      }>(`/analytics/posts/${slug}`)
      output(result, () => {
        const lines = [
          `/${result.slug}`,
          `Views (7d): ${result.views_7d}  |  Views (30d): ${result.views_30d}`,
          '',
        ]
        if (result.daily_views.length) {
          lines.push(table(
            ['Date', 'Views'],
            result.daily_views.map((d) => [d.date, String(d.views)]),
          ))
        }
        return lines.join('\n')
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to fetch post analytics')
    }
  })
