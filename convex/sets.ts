import { ConvexError, v } from 'convex/values'
import { internalQuery, mutation, query } from './_generated/server'
import { ELEVEN_LABS_VOICES } from './elevenlabs.lib'
import { handlePromise } from './lib'
import { requireCurrentUser } from './users'

export const createSet = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx)

    if (!user) {
      throw new ConvexError('User not found')
    }

    const voices = Object.values(ELEVEN_LABS_VOICES)
    const firstVoice = voices[0]

    const createSetPromise = ctx.db.insert('voiceSets', {
      name: args.name,
      selectedVoiceId: firstVoice.id,
      updatedAt: Date.now(),
      userId: user._id,
      totalMessages: 1,
    })

    const [setId, createSetError] = await handlePromise(createSetPromise)

    if (createSetError) {
      throw new ConvexError('Failed to create set')
    }

    const createMessagePromise = ctx.db.insert('voiceMessages', {
      setId,
      position: 1,
      currentText: 'Your first voice message.',
      updatedAt: Date.now(),
      userId: user._id,
    })

    const [messageId, createMessageError] =
      await handlePromise(createMessagePromise)

    if (createMessageError) {
      throw new ConvexError('Failed to create message')
    }

    return {
      setId,
      messageId,
    }
  },
})

export const getAllSets = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx)

    if (!user) {
      return []
    }

    const sets = await ctx.db
      .query('voiceSets')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    return sets
  },
})

export const getSetById = query({
  args: {
    id: v.id('voiceSets'),
  },
  handler: async (ctx, args) => {
    const set = await ctx.db.get(args.id)

    return set
  },
})

export const updateSet = mutation({
  args: {
    id: v.id('voiceSets'),
    data: v.object({
      name: v.optional(v.string()),
      selectedVoiceId: v.optional(v.string()),
      totalMessages: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.data)
  },
})

export const getSetByMessageId = internalQuery({
  args: {
    id: v.id('voiceMessages'),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id)

    if (!message) {
      return null
    }

    const set = await ctx.db.get(message.setId)

    if (!set) {
      return null
    }

    return set
  },
})

export const deleteSet = mutation({
  args: {
    id: v.id('voiceSets'),
  },
  handler: async (ctx, args) => {
    // 1. we need all messages for this set
    // 2. we need all files for these messages, delete them from storage
    // we're gonna need to check if they have lastGenerationMetadata, then it means they've generated an audio file
    // 3. delete the set itself

    const set = await ctx.db.get(args.id)

    if (!set) {
      throw new ConvexError('Set not found')
    }

    const messages = await ctx.db
      .query('voiceMessages')
      .withIndex('by_setId', (q) => q.eq('setId', set._id))
      .collect()

    const messageFileDeletionPromises = []
    const messagesDeletionPromises = []

    for (const message of messages) {
      if (message.lastGenerationMetadata) {
        messageFileDeletionPromises.push(
          ctx.storage.delete(message.lastGenerationMetadata.audioFileId)
        )
      }

      messagesDeletionPromises.push(ctx.db.delete(message._id))
    }

    const deleteSetPromise = ctx.db.delete(args.id)

    await Promise.all([
      ...messageFileDeletionPromises,
      ...messagesDeletionPromises,
      deleteSetPromise,
    ])

    return {
      success: true,
    }
  },
})

export const getSetAudioFiles = query({
  args: { setId: v.id('voiceSets') },
  async handler(ctx, args) {
    const messages = await ctx.db
      .query('voiceMessages')
      .withIndex('by_setId', (q) => q.eq('setId', args.setId))
      .collect()

    const messagesWithAudioFiles = messages.filter(
      (msg) => msg.lastGenerationMetadata !== undefined
    )

    return Promise.all(
      messagesWithAudioFiles.map(async (msg) => ({
        position: msg.position,
        audioUrl: await ctx.storage.getUrl(
          msg.lastGenerationMetadata!.audioFileId
        ),
      }))
    )
  },
})
