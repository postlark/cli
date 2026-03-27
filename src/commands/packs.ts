import { Command } from 'commander'
import { apiCall } from '../client.js'
import { output, error, success } from '../output.js'

export const packsCommand = new Command('packs')
  .description('Post pack balance and purchase (Starter+)')
  .action(async () => {
    try {
      const result = await apiCall<{ balance: number }>('/packs/balance')
      output(result, () => `Post pack balance: ${result.balance} posts remaining`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to fetch pack balance')
    }
  })

packsCommand
  .command('purchase')
  .description('Purchase a post pack')
  .requiredOption('--type <type>', 'Pack type: 100 or 300')
  .action(async (opts) => {
    const type = parseInt(opts.type, 10)
    if (type !== 100 && type !== 300) {
      error('Pack type must be 100 or 300')
    }
    try {
      const result = await apiCall<{ balance: number; checkout_url?: string }>('/packs/purchase', {
        method: 'POST',
        body: { type },
      })
      output(result, () => {
        if (result.checkout_url) {
          return `Checkout: ${result.checkout_url}`
        }
        return `Pack purchased. New balance: ${result.balance}`
      })
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to purchase pack')
    }
  })
