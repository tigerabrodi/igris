import { Doc, Id } from '@convex/_generated/dataModel'
import { useConvex } from 'convex/react'
import { useAtom } from 'jotai'
import { useCallback, useMemo, useState } from 'react'
import { useAudioContext } from '../audio-context/context'
import {
  messageOperationAtom,
  useVoiceOperations,
} from '../hooks/voice-operation'
import { getAudioUrl } from '../lib/utils'
import { useVoiceSetContext } from '../set-context/context'
import { MessageToViewType, VoiceMessageView } from './voice-message-view'

export function VoiceMessage({
  message,
  index,
  onMessageChange,
  handleDeleteMessage,
  setTextareaRef,
}: {
  message: Doc<'voiceMessages'>
  index: number
  onMessageChange: (messageId: Id<'voiceMessages'>, text: string) => void
  handleDeleteMessage: (messageId: Id<'voiceMessages'>) => void
  setTextareaRef: (params: {
    id: Id<'voiceMessages'>
    textareaElement: HTMLTextAreaElement | null
    index: number
  }) => void
}) {
  const { state, prefetchUrl } = useAudioContext()
  const { handleGenerate, handleDownload } = useVoiceOperations()
  const { playMessage } = useAudioContext()

  const messageAtom = useMemo(
    () => messageOperationAtom(message._id),
    [message._id]
  )
  const [messageOperation] = useAtom(messageAtom)

  const { focusedMessageRef, messagesRefs } = useVoiceSetContext()
  const convex = useConvex()

  const [text, setText] = useState(message.currentText)

  const messageToView: MessageToViewType = {
    isGenerating: messageOperation.generateStatus === 'loading',
    hasGeneratedAnyAudio: message.lastGenerationMetadata !== undefined,
    isPending: 'status' in message && message.status === 'pending',
  }

  const handleGenerateMessageAudio = useCallback(async () => {
    await handleGenerate({
      messageId: message._id,
      text,
    })

    await handlePlayMessage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGenerate, message._id, text])

  const handlePlayMessage = useCallback(async () => {
    if (!messageToView.hasGeneratedAnyAudio) return

    await playMessage({
      messageId: message._id,
      getUrl: async () => {
        const url = await getAudioUrl(message._id, convex)
        return url
      },
    })
  }, [message._id, messageToView.hasGeneratedAnyAudio, playMessage, convex])

  const handlePrefetch = useCallback(() => {
    if (messageToView.hasGeneratedAnyAudio) {
      void prefetchUrl(message._id, async () => {
        const url = await getAudioUrl(message._id, convex)
        return url
      })
    }
  }, [message._id, messageToView.hasGeneratedAnyAudio, prefetchUrl, convex])

  const handleFocus = useCallback(() => {
    const messageRef = messagesRefs.current?.[index]
    if (!messageRef) return

    focusedMessageRef.current = {
      id: message._id,
      textareaElement: messageRef.textareaElement,
      index,
    }
  }, [focusedMessageRef, index, message._id, messagesRefs])

  return (
    <div key={message._id} className="flex items-start gap-4">
      <div className="text-muted-foreground w-8 text-center text-sm">
        {index + 1}
      </div>
      <VoiceMessageView
        message={messageToView}
        text={text}
        isDownloading={messageOperation.downloadStatus === 'loading'}
        onDownload={() => handleDownload(message._id)}
        isPlaying={state.currentMessageId === message._id}
        onGenerate={() => handleGenerateMessageAudio()}
        onPlay={() => handlePlayMessage()}
        onDelete={() => handleDeleteMessage(message._id)}
        onPrefetch={handlePrefetch}
        onFocus={handleFocus}
        onTextChange={(text) => {
          setText(text)
          void onMessageChange(message._id, text)
        }}
        textareaRef={(element) => {
          setTextareaRef({
            id: message._id,
            textareaElement: element,
            index,
          })
        }}
      />
    </div>
  )
}
