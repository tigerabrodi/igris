import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { api } from './_generated/api'
import { Doc } from './_generated/dataModel'
import { ActionCtx, mutation, query, QueryCtx } from './_generated/server'

/**
 * This function is used to get the current user.
 * It's important that it's type safe so we don't run into inference loop issues.
 */
export async function requireCurrentUser(
  ctx: QueryCtx | ActionCtx
): Promise<Doc<'users'>> {
  const user = await ctx.runQuery(api.users.getCurrentUser)
  if (!user) {
    throw new Error('User not found')
  }

  return user
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }
    return await ctx.db.get(userId)
  },
})

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
  },
})

export const updateUser = mutation({
  args: {
    userId: v.id('users'),
    data: v.object({
      api: v.optional(
        v.object({
          encryptedKey: v.array(v.number()),
          initializationVector: v.array(v.number()),
        })
      ),
    }),
  },
  handler: async (ctx, { userId, data }) => {
    return await ctx.db.patch(userId, data)
  },
})
