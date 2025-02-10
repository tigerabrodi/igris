import { useConvex } from 'convex/react'
import { FunctionReference } from 'convex/server'
import { useCallback } from 'react'

export function usePrefetchQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: Query['_args'],
  options: {
    timeoutMs?: number
  } = { timeoutMs: 20000 }
) {
  const convex = useConvex()

  const prefetch = useCallback(() => {
    const watch = convex.watchQuery(query, args)
    // Just subscribe to keep the data in cache
    const unsubscribe = watch.onUpdate(() => {})

    setTimeout(() => {
      unsubscribe()
    }, options.timeoutMs)

    return unsubscribe
  }, [convex, query, args, options.timeoutMs])

  return prefetch
}
