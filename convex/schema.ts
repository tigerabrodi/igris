import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    email: v.string(),
    updatedAt: v.number(),
    api: v.optional(
      v.object({
        encryptedKey: v.array(v.number()), // For Uint8Array storage
        initializationVector: v.array(v.number()), // initialization vector for encryption
      })
    ),
  }).index('by_email', ['email']),

  voiceSets: defineTable({
    name: v.string(),
    selectedVoiceId: v.string(), // Maps to our voice constants
    updatedAt: v.number(),
    userId: v.id('users'),
    totalMessages: v.number(),
  }).index('by_userId', ['userId']),

  voiceMessages: defineTable({
    position: v.number(),
    currentText: v.string(),
    lastGenerationMetadata: v.optional(
      v.object({
        text: v.string(),
        elevenLabsVoiceId: v.string(),
        audioFileId: v.id('_storage'),
      })
    ),
    updatedAt: v.number(),
    setId: v.id('voiceSets'),
    userId: v.id('users'),
  }).index('by_setId', ['setId']),
})

export default schema
