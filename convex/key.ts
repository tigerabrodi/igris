'use node'

import { ConvexError, v } from 'convex/values'
import crypto from 'crypto'
import { api } from './_generated/api'
import { action } from './_generated/server'
import { handlePromise } from './lib'
import { requireCurrentUser } from './users'

const ALGORITHM = { name: 'AES-GCM', length: 256 }

async function getEncryptionKey() {
  const encoder = new TextEncoder()
  const keyMaterial = encoder.encode(process.env.CONVEX_ENCRYPTION_SECRET)
  const hash = await crypto.subtle.digest('SHA-256', keyMaterial)

  return await crypto.subtle.importKey('raw', hash, ALGORITHM, false, [
    'encrypt',
    'decrypt',
  ])
}

export const storeApiKey = action({
  args: { apiKey: v.string() },
  async handler(ctx, args) {
    const user = await requireCurrentUser(ctx)

    if (!user) {
      throw new ConvexError('User not found')
    }

    const [key, error] = await handlePromise(getEncryptionKey())

    if (error) {
      throw new ConvexError('Failed to get encryption key')
    }

    const initializationVector = crypto.getRandomValues(new Uint8Array(12))

    const encryptionPromise = crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: initializationVector },
      key,
      new TextEncoder().encode(args.apiKey)
    )

    const [encrypted, encryptionError] = await handlePromise(encryptionPromise)

    if (encryptionError) {
      throw new ConvexError('Failed to encrypt API key')
    }

    await ctx.runMutation(api.users.updateUser, {
      userId: user._id,
      data: {
        api: {
          encryptedKey: Array.from(new Uint8Array(encrypted)),
          initializationVector: Array.from(initializationVector),
        },
      },
    })
  },
})

export const getApiKey = action({
  async handler(ctx) {
    const user = await requireCurrentUser(ctx)

    if (!user) {
      return null
    }

    if (!user.api) {
      return null
    }

    const [key, getKeyError] = await handlePromise(getEncryptionKey())

    if (getKeyError) {
      throw new ConvexError('Failed to get encryption key')
    }

    const decryptionPromise = crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(user.api?.initializationVector) },
      key,
      new Uint8Array(user.api?.encryptedKey)
    )

    const [decrypted, decryptionError] = await handlePromise(decryptionPromise)

    if (decryptionError) {
      throw new ConvexError('Failed to decrypt API key')
    }

    return new TextDecoder().decode(decrypted)
  },
})
