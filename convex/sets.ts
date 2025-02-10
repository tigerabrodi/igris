import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { ELEVEN_LABS_VOICES } from './elevenlabs.lib'
import { requireCurrentUser } from './users'

export const createSet = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx)

    const voices = Object.values(ELEVEN_LABS_VOICES)
    const firstVoice = voices[0]

    const setId = await ctx.db.insert('voiceSets', {
      name: args.name,
      selectedVoiceId: firstVoice.id,
      updatedAt: Date.now(),
      userId: user._id,
      totalMessages: 1,
    })

    await ctx.db.insert('voiceMessages', {
      setId,
      position: 1,
      currentText: 'Your first voice message.',
      updatedAt: Date.now(),
      userId: user._id,
    })

    return setId
  },
})
