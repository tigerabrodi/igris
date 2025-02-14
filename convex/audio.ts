'use node'

import { ConvexError, v } from 'convex/values'
import { api, internal } from './_generated/api'
import { action } from './_generated/server'
import { handlePromise } from './lib'
import { generateAudioFromElevenLabs } from './node.lib'

export const generateAndStoreAudio = action({
  args: {
    text: v.string(),
    messageId: v.id('voiceMessages'),
  },
  handler: async (ctx, args) => {
    const getApiKeyPromise = ctx.runAction(api.key.getApiKey)

    const [apiKey, getApiKeyError] = await handlePromise(getApiKeyPromise)

    if (getApiKeyError) {
      throw new ConvexError('Failed to get API key')
    }

    if (!apiKey) {
      throw new ConvexError('API key not found')
    }

    const set = await ctx.runQuery(internal.sets.getSetByMessageId, {
      id: args.messageId,
    })

    if (!set) {
      throw new ConvexError('Set not found')
    }

    const [audioBlob, generateAudioError] = await handlePromise(
      generateAudioFromElevenLabs({
        text: args.text,
        voiceId: set.selectedVoiceId,
        apiKey,
      })
    )

    if (generateAudioError) {
      throw generateAudioError
    }

    const [storageId, storeError] = await handlePromise(
      ctx.storage.store(audioBlob)
    )

    if (storeError) {
      throw new ConvexError('Failed to store audio')
    }

    const [, updateError] = await handlePromise(
      ctx.runMutation(internal.messages.updateWithAudio, {
        messageId: args.messageId,
        storageId,
        lastGeneratedText: args.text,
        lastUsedVoice: set.selectedVoiceId,
      })
    )

    if (updateError) {
      throw new ConvexError('Failed to update message')
    }

    return {
      success: true,
    }
  },
})
