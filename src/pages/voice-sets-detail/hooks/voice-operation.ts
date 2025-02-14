import { ERROR_TOAST_DURATION } from '@/lib/constants'
import { handlePromise, slugify, Status } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useConvex } from 'convex/react'
import { atom, useAtom } from 'jotai'
import { useCallback } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import { useAudioContext } from '../audio-context/context'
import { downloadBlob, getAudioUrl } from '../lib/utils'
import { useVoiceSetContext } from '../set-context/context'

type MessageOperationState = {
  generateStatus: Status
  downloadStatus: Status
}

export const messageOperationsAtom = atom<
  Record<Id<'voiceMessages'>, MessageOperationState>
>({})

/**
 * Derived atom factory for individual message states
 * NOTE: When using in components, make sure to wrap around useMemo to avoid recreating atom on every render
 * @param messageId - The ID of the message to get the state for
 * @returns An atom with the message state
 */
export const messageOperationAtom = (messageId: Id<'voiceMessages'>) =>
  atom(
    (get) =>
      get(messageOperationsAtom)[messageId] ?? {
        generateStatus: 'idle',
        downloadStatus: 'idle',
      }
  )

export function useVoiceOperations() {
  const { voiceSetId } = useParams<{ voiceSetId: Id<'voiceSets'> }>()
  const { focusedMessageRef } = useVoiceSetContext()
  const { playMessage } = useAudioContext()
  const convex = useConvex()
  const [messageOperations, setMessageOperations] = useAtom(
    messageOperationsAtom
  )

  const handleUpdateMessageOperation = useCallback(
    (
      messageId: Id<'voiceMessages'>,
      updates: Partial<MessageOperationState>
    ) => {
      setMessageOperations((current) => ({
        ...current,
        [messageId]: {
          ...current[messageId],
          ...updates,
        },
      }))
    },
    [setMessageOperations]
  )

  const handleGenerate = useCallback(
    async ({
      messageId,
      text,
    }: {
      messageId: Id<'voiceMessages'>
      text: string
    }) => {
      const isAlreadyGenerating =
        (messageOperations[messageId]?.generateStatus ?? 'idle') === 'loading'

      if (isAlreadyGenerating) {
        return
      }

      handleUpdateMessageOperation(messageId, { generateStatus: 'loading' })

      const [, error] = await handlePromise(
        convex.action(api.audio.generateAndStoreAudio, {
          messageId,
          text,
        })
      )

      if (error) {
        toast.error('Failed to generate audio')
        handleUpdateMessageOperation(messageId, { generateStatus: 'error' })
        return
      }

      const updatedMessage = await convex.query(api.messages.getMessageById, {
        messageId,
      })

      if (!updatedMessage) {
        toast.error('Could not play message, please try manually')
        handleUpdateMessageOperation(messageId, { generateStatus: 'error' })
        return
      }

      await playMessage({
        messageId,
        getUrl: async () => {
          const url = await getAudioUrl(messageId, convex)
          return url
        },
      })

      handleUpdateMessageOperation(messageId, { generateStatus: 'success' })
    },
    [convex, handleUpdateMessageOperation, messageOperations, playMessage]
  )

  const handleGenerateForFocused = useCallback(async () => {
    const focused = focusedMessageRef.current
    if (!focused?.textareaElement) return

    return handleGenerate({
      messageId: focused.id,
      text: focused.textareaElement.value,
    })
  }, [focusedMessageRef, handleGenerate])

  const handleDownload = useCallback(
    async (messageId: Id<'voiceMessages'>) => {
      const isAlreadyDownloading =
        (messageOperations[messageId]?.downloadStatus ?? 'idle') === 'loading'
      if (isAlreadyDownloading) {
        return
      }

      handleUpdateMessageOperation(messageId, { downloadStatus: 'loading' })

      const [dbMessage, dbMessageError] = await handlePromise(
        convex.query(api.messages.getMessageById, {
          messageId,
        })
      )

      const [voiceSet, voiceSetError] = await handlePromise(
        convex.query(api.sets.getSetById, {
          id: voiceSetId!,
        })
      )

      if (voiceSetError || !voiceSet || !dbMessage || dbMessageError) {
        toast.error('Failed to get message')
        handleUpdateMessageOperation(messageId, { downloadStatus: 'error' })
        return
      }

      // Should never happen since we disable the download button if there is no audio generated
      const hasGeneratedAnyAudio =
        dbMessage.lastGenerationMetadata !== undefined
      if (!hasGeneratedAnyAudio) {
        toast.error('No audio generated for this message', {
          duration: ERROR_TOAST_DURATION,
        })
        handleUpdateMessageOperation(dbMessage._id, { downloadStatus: 'error' })
        return
      }

      handleUpdateMessageOperation(dbMessage._id, { downloadStatus: 'loading' })

      const [url, getUrlError] = await handlePromise(
        getAudioUrl(dbMessage._id, convex)
      )

      if (getUrlError || !url) {
        toast.error('Failed to get audio URL')
        handleUpdateMessageOperation(dbMessage._id, { downloadStatus: 'error' })
        return
      }

      const [blob, downloadError] = await handlePromise(
        fetch(url).then((res) => res.blob())
      )

      if (downloadError || !blob) {
        toast.error('Failed to download audio')
        handleUpdateMessageOperation(dbMessage._id, { downloadStatus: 'error' })
        return
      }

      // Use the message position for order in filename
      downloadBlob(blob, `${slugify(voiceSet.name)}-${dbMessage.position}.mp3`)

      handleUpdateMessageOperation(dbMessage._id, { downloadStatus: 'success' })
    },
    [handleUpdateMessageOperation, convex, voiceSetId, messageOperations]
  )

  const handleDownloadForFocused = useCallback(() => {
    const focused = focusedMessageRef.current
    if (!focused) return

    void handleDownload(focused.id)
  }, [focusedMessageRef, handleDownload])

  return {
    handleGenerate,
    handleGenerateForFocused,
    handleDownload,
    handleDownloadForFocused,
  }
}
