import { ConvexError, v } from 'convex/values'
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { handlePromise } from './lib'
import { requireCurrentUser } from './users'

export const getAllMessagesBySetId = query({
  args: {
    setId: v.id('voiceSets'),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx)

    if (!user) {
      throw new ConvexError('User not found')
    }

    const messages = await ctx.db
      .query('voiceMessages')
      .withIndex('by_setId_userId', (q) =>
        q.eq('setId', args.setId).eq('userId', user._id)
      )
      .collect()

    return messages
  },
})

// We throw if we don't find what's required for a deletion e.g. message or set
// If set doesn't exist (should never happen), we throw
// Important: Because we're deleting a message, we need handle the decrement of a set's totalMessages but also all the positions of subsequent messages
export const deleteMessage = mutation({
  args: {
    messageId: v.id('voiceMessages'),
    setId: v.id('voiceSets'),
  },
  handler: async (ctx, args) => {
    const [set, getSetError] = await handlePromise(ctx.db.get(args.setId))
    if (getSetError || !set) {
      throw new ConvexError(getSetError ? 'Failed to get set' : 'Set not found')
    }

    const [message, getMessageError] = await handlePromise(
      ctx.db.get(args.messageId)
    )
    if (getMessageError || !message) {
      throw new ConvexError(
        getMessageError ? 'Failed to get message' : 'Message not found'
      )
    }

    // Get all messages with higher positions
    const subsequentMessages = await ctx.db
      .query('voiceMessages')
      .filter((q) => q.eq(q.field('setId'), args.setId))
      .filter((q) => q.gt(q.field('position'), message.position))
      .collect()

    const promises = []

    // Delete audio file if exists
    if (message.lastGenerationMetadata?.audioFileId) {
      promises.push(
        ctx.storage.delete(message.lastGenerationMetadata.audioFileId)
      )
    }

    const updateSetTotalMessagesPromise = ctx.db.patch(args.setId, {
      totalMessages: set.totalMessages - 1,
    })

    promises.push(updateSetTotalMessagesPromise)

    // Delete the message
    const deleteMessagePromise = ctx.db.delete(args.messageId)
    promises.push(deleteMessagePromise)

    // Decrement positions of all subsequent messages
    for (const msg of subsequentMessages) {
      const updateMessagePositionPromise = ctx.db.patch(msg._id, {
        position: msg.position - 1,
      })
      promises.push(updateMessagePositionPromise)
    }

    // Execute all operations
    const [, deleteError] = await handlePromise(Promise.all(promises))
    if (deleteError) {
      throw new ConvexError('Failed to delete message and update positions')
    }

    return { success: true }
  },
})

export const updateWithAudio = internalMutation({
  args: {
    messageId: v.id('voiceMessages'),
    storageId: v.id('_storage'),
    lastGeneratedText: v.string(),
    lastUsedVoice: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      lastGenerationMetadata: {
        audioFileId: args.storageId,
        text: args.lastGeneratedText,
        elevenLabsVoiceId: args.lastUsedVoice,
      },
    })
  },
})

export const createMessage = mutation({
  args: {
    setId: v.id('voiceSets'),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx)

    if (!user) {
      throw new ConvexError('User not found')
    }

    const set = await ctx.db.get(args.setId)

    if (!set) {
      throw new ConvexError('Set not found')
    }

    const newTotalMessages = set.totalMessages + 1

    const updateSetTotalMessagesPromise = ctx.db.patch(args.setId, {
      totalMessages: newTotalMessages,
    })

    const [, updateSetTotalMessagesError] = await handlePromise(
      updateSetTotalMessagesPromise
    )

    if (updateSetTotalMessagesError) {
      throw new ConvexError('Failed to update set total messages')
    }

    const updateMessagePromise = ctx.db.insert('voiceMessages', {
      setId: args.setId,
      userId: user._id,
      position: newTotalMessages,
      currentText: 'Create a voice message...',
      updatedAt: Date.now(),
    })

    const [newMessageId, insertError] =
      await handlePromise(updateMessagePromise)

    if (insertError || !newMessageId) {
      throw new ConvexError('Failed to create message')
    }

    const newMessage = await ctx.db.get(newMessageId)

    if (!newMessage) {
      throw new ConvexError('Failed to create message')
    }

    return newMessage
  },
})

export const updateMessage = mutation({
  args: {
    messageId: v.id('voiceMessages'),
    data: v.object({
      text: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const updatePromise = ctx.db.patch(args.messageId, {
      currentText: args.data.text,
      updatedAt: Date.now(),
    })

    const [, updateError] = await handlePromise(updatePromise)

    if (updateError) {
      throw new ConvexError('Failed to update message')
    }

    return {
      success: true,
    }
  },
})

export const getAudioUrl = query({
  args: { messageId: v.id('voiceMessages') },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)

    if (!message?.lastGenerationMetadata?.audioFileId) {
      return null
    }

    const url = await ctx.storage.getUrl(
      message.lastGenerationMetadata.audioFileId
    )

    return url
  },
})

export const getMessageById = query({
  args: { messageId: v.id('voiceMessages') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId)
  },
})

export const getMessageForAudio = internalQuery({
  args: { messageId: v.id('voiceMessages') },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new ConvexError('Message not found')
    }
    return message
  },
})

export const getMessageStorageId = internalQuery({
  args: { messageId: v.id('voiceMessages') },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)
    if (!message?.lastGenerationMetadata?.audioFileId) {
      return null
    }

    return message.lastGenerationMetadata.audioFileId
  },
})
