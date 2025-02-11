import { ERROR_TOAST_DURATION } from '@/lib/constants'
import { handlePromise, Status } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Doc } from '@convex/_generated/dataModel'
import { useAction, useConvex } from 'convex/react'
import { ConvexError } from 'convex/values'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAudioContext } from '../audio-context/context'
import { getAudioUrl } from '../lib/utils'

export function useVoiceMessage(message: Doc<'voiceMessages'>) {
  const generateAndStoreAudio = useAction(api.audio.generateAndStoreAudio)
  const [generateStatus, setGenerateStatus] = useState<Status>('idle')
  const convex = useConvex()

  const { playMessage } = useAudioContext()

  const messageToView = {
    initialText: message.currentText,
    isGenerating: generateStatus === 'loading',
    hasGeneratedAnyAudio: message.lastGenerationMetadata !== undefined,
    isPending: 'status' in message && message.status === 'pending',
  }

  const handlePlayMessage = async () => {
    if (!message.lastGenerationMetadata?.audioFileId) return

    await playMessage(message._id, async () => {
      const url = await getAudioUrl(message._id, convex)
      return url
    })
  }

  // currentText is client state
  // We want the most up to date text since we're debouncing the db write
  // selectedVoiceId's update isn't debounced, so inside the convex action we can get it from the db
  const handleGenerate = async ({ currentText }: { currentText: string }) => {
    // 1. Generate the audio
    // 2. Play the new audio

    setGenerateStatus('loading')

    const [, error] = await handlePromise(
      generateAndStoreAudio({
        messageId: message._id,
        text: currentText,
      })
    )

    if (error) {
      setGenerateStatus('error')
      if (error instanceof ConvexError) {
        toast.error('Failed to generate audio', {
          description: error.message,
          duration: ERROR_TOAST_DURATION,
        })
        return
      }

      toast.error('Failed to generate audio', {
        description: error.message,
        duration: ERROR_TOAST_DURATION,
      })
      return
    }

    setGenerateStatus('success')

    await handlePlayMessage()
  }

  return {
    messageToView,
    handlePlayMessage,
    handleGenerate,
  }
}
