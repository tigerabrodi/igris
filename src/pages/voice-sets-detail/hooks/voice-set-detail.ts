import { api } from '@convex/_generated/api'
import { Doc, Id } from '@convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { useParams } from 'react-router'

export function useVoiceSetDetail() {
  const { voiceSetId } = useParams<{ voiceSetId: Id<'voiceSets'> }>()

  const voiceSet = useQuery(api.sets.getSetById, {
    id: voiceSetId as Id<'voiceSets'>,
  })

  const updateVoiceSet = useMutation(api.sets.updateSet)
  const deleteSet = useMutation(api.sets.deleteSet)

  const messages = useQuery(api.messages.getAllMessagesBySetId, {
    setId: voiceSetId as Id<'voiceSets'>,
  })

  const deleteMessage = useMutation(api.messages.deleteMessage)

  const createMessage = useMutation(
    api.messages.createMessage
  ).withOptimisticUpdate((localStore, args) => {
    const { setId } = args
    const existingMessages = localStore.getQuery(
      api.messages.getAllMessagesBySetId,
      {
        setId,
      }
    )

    if (existingMessages !== undefined) {
      const now = Date.now()
      const position = existingMessages.length + 1

      const tempMessage: Doc<'voiceMessages'> & {
        status: 'pending'
      } = {
        _id: crypto.randomUUID() as Id<'voiceMessages'>,
        _creationTime: now,
        position,
        currentText: 'Create a voice message...',
        updatedAt: now,
        setId,
        userId: '' as Id<'users'>, // Server will set this
        status: 'pending' as const, // Client-only state
      }

      localStore.setQuery(api.messages.getAllMessagesBySetId, { setId }, [
        ...existingMessages,
        tempMessage,
      ])
    }
  })

  const updateMessage = useMutation(api.messages.updateMessage)

  return {
    voiceSet,
    messages,
    deleteMessage,
    createMessage,
    updateMessage,
    updateVoiceSet,
    deleteSet,
  }
}
