import { Command } from 'commander'
import { readdirSync, readFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import { apiCall } from '../client.js'
import { output, error } from '../output.js'

interface Frontmatter {
  title?: string
  slug?: string
  tags?: string[]
  status?: string
}

/** Parse YAML-like frontmatter between --- delimiters */
function parseFrontmatter(raw: string): { meta: Frontmatter; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw }
  const meta: Frontmatter = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/)
    if (!m) continue
    const [, key, val] = m
    if (key === 'title') meta.title = val.trim().replace(/^["']|["']$/g, '')
    else if (key === 'slug') meta.slug = val.trim()
    else if (key === 'tags') {
      // Parse [tag1, tag2] or tag1, tag2
      const cleaned = val.trim().replace(/^\[|\]$/g, '')
      meta.tags = cleaned.split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''))
    }
    else if (key === 'status') meta.status = val.trim()
  }
  return { meta, content: match[2] }
}

/** Derive slug from filename: "my-post.md" → "my-post" */
function slugFromFilename(filename: string): string {
  return basename(filename, '.md').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export const deployCommand = new Command('deploy')
  .description('Deploy a directory of .md files to your blog')
  .argument('[dir]', 'Directory containing .md files', '.')
  .option('--status <status>', 'Default status for new posts', 'published')
  .option('--dry-run', 'Show what would happen without making changes')
  .option('--delete-missing', 'Delete server posts not found locally')
  .action(async (dir: string, opts) => {
    try {
      // 1. Scan local .md files
      const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
      if (files.length === 0) {
        error(`No .md files found in "${dir}"`)
      }

      const localPosts = files.map((f) => {
        const raw = readFileSync(join(dir, f), 'utf-8')
        const { meta, content } = parseFrontmatter(raw)
        const slug = meta.slug ?? slugFromFilename(f)
        const title = meta.title ?? basename(f, '.md')
        return { file: f, slug, title, content, tags: meta.tags, status: meta.status ?? opts.status }
      })

      // 2. Fetch existing posts from server
      const existing = await apiCall<{
        data: Array<{ slug: string; title: string }>
        pagination: { total: number; page: number; total_pages: number }
      }>('/posts?per_page=200')
      const serverSlugs = new Set(existing.data.map((p) => p.slug))
      const localSlugs = new Set(localPosts.map((p) => p.slug))

      // 3. Categorize
      const toCreate = localPosts.filter((p) => !serverSlugs.has(p.slug))
      const toUpdate = localPosts.filter((p) => serverSlugs.has(p.slug))
      const toDelete = opts.deleteMissing
        ? existing.data.filter((p) => !localSlugs.has(p.slug))
        : []

      // 4. Dry run
      if (opts.dryRun) {
        const plan = {
          create: toCreate.map((p) => p.slug),
          update: toUpdate.map((p) => p.slug),
          delete: toDelete.map((p) => p.slug),
        }
        output(plan, () => {
          const lines = []
          if (toCreate.length) lines.push(`Create (${toCreate.length}):`, ...toCreate.map((p) => `  + ${p.slug} — "${p.title}"`))
          if (toUpdate.length) lines.push(`Update (${toUpdate.length}):`, ...toUpdate.map((p) => `  ~ ${p.slug} — "${p.title}"`))
          if (toDelete.length) lines.push(`Delete (${toDelete.length}):`, ...toDelete.map((p) => `  - ${p.slug} — "${p.title}"`))
          if (lines.length === 0) lines.push('Nothing to do.')
          return lines.join('\n')
        })
        return
      }

      // 5. Execute
      let created = 0, updated = 0, deleted = 0, errors = 0

      for (const p of toCreate) {
        try {
          await apiCall('/posts', {
            method: 'POST',
            body: { title: p.title, content: p.content, slug: p.slug, tags: p.tags, status: p.status },
          })
          console.log(`  + ${p.slug}`)
          created++
        } catch (err) {
          console.error(`  ! ${p.slug}: ${err instanceof Error ? err.message : 'error'}`)
          errors++
        }
      }

      for (const p of toUpdate) {
        try {
          await apiCall(`/posts/${p.slug}`, {
            method: 'PUT',
            body: { title: p.title, content: p.content, tags: p.tags },
          })
          console.log(`  ~ ${p.slug}`)
          updated++
        } catch (err) {
          console.error(`  ! ${p.slug}: ${err instanceof Error ? err.message : 'error'}`)
          errors++
        }
      }

      for (const p of toDelete) {
        try {
          await apiCall(`/posts/${p.slug}`, { method: 'DELETE' })
          console.log(`  - ${p.slug}`)
          deleted++
        } catch (err) {
          console.error(`  ! ${p.slug}: ${err instanceof Error ? err.message : 'error'}`)
          errors++
        }
      }

      const summary = { created, updated, deleted, unchanged: toUpdate.length - updated + (localPosts.length - toCreate.length - toUpdate.length), errors }
      output(summary, () =>
        `\nDone: ${created} created, ${updated} updated, ${deleted} deleted, ${errors} errors`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Deploy failed')
    }
  })
