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
})

export default schema
