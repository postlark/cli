import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { basename, extname } from 'node:path'
import { apiCall } from '../client.js'
import { output, error } from '../output.js'

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

export const uploadCommand = new Command('upload')
  .description('Upload an image to blog media storage (jpg, png, gif, webp, max 5MB)')
  .argument('<file>', 'Path to image file')
  .action(async (filePath: string) => {
    try {
      const ext = extname(filePath).toLowerCase()
      const contentType = MIME_MAP[ext]
      if (!contentType) {
        error(`Unsupported file type: ${ext}. Supported: jpg, jpeg, png, gif, webp`)
        return
      }

      const buffer = readFileSync(filePath)
      if (buffer.length > 5 * 1024 * 1024) {
        error('Image too large. Maximum size is 5MB.')
        return
      }

      const data = buffer.toString('base64')
      const filename = basename(filePath)

      const result = await apiCall<{ url: string }>('/upload', {
        method: 'POST',
        body: { data, filename, content_type: contentType },
      })

      output(result, () => `Uploaded: ${result.url}\n\nMarkdown:\n![${filename}](${result.url})`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to upload image')
    }
  })
