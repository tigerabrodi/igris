import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Doc, Id } from '@convex/_generated/dataModel'
import { useConvex } from 'convex/react'
import { Download, Loader2, Play, Trash2, Wand2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useAudioContext } from '../audio-context/context'
import { useVoiceMessage } from '../hooks/voice-message'
import { getAudioUrl } from '../lib/utils'

type VoiceMessageViewProps = {
  message: {
    isGenerating: boolean
    hasGeneratedAnyAudio: boolean
    isPending: boolean
  }
  isPlaying: boolean
  onTextChange: (text: string) => void
  onGenerate: () => void
  onPlay: () => void
  onDelete: () => void
  textareaRef: (element: HTMLTextAreaElement | null) => void
  onPrefetch: () => void

  text: string
}

function VoiceMessageView({
  message,
  isPlaying,
  onGenerate,
  onPlay,
  onDelete,
  textareaRef,
  text,
  onTextChange,
  onPrefetch,
}: VoiceMessageViewProps) {
  return (
    <div className="flex flex-1 gap-4">
      <Textarea
        ref={textareaRef}
        value={text}
        disabled={message.isPending}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="Enter your message..."
        className={cn('min-h-[100px] flex-1', {
          'border-primary': isPlaying,
        })}
      />
      <div
        className="flex min-w-[100px] flex-col justify-between gap-2"
        // Start prefetching earlier for good ux
        onMouseEnter={onPrefetch}
      >
        <div className="flex gap-2">
          <Button
            size="icon"
            variant={message.isGenerating ? 'outline' : 'default'}
            className="size-9"
            disabled={message.isGenerating || message.isPending || !text}
            onClick={onGenerate}
          >
            {message.isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wand2 className="size-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-9"
            disabled={!message.hasGeneratedAnyAudio}
            onClick={onPlay}
            aria-label={`Play ${text}`}
          >
            <Play className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-9"
            disabled={!message.hasGeneratedAnyAudio}
            aria-label="Download"
          >
            <Download className="size-4" />
          </Button>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}

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
  setTextareaRef: (index: number, element: HTMLTextAreaElement | null) => void
}) {
  const { state, prefetchUrl } = useAudioContext()
  const { messageToView, handlePlayMessage, handleGenerate } =
    useVoiceMessage(message)

  const convex = useConvex()

  const [text, setText] = useState(message.currentText)

  const handlePrefetch = useCallback(() => {
    if (messageToView.hasGeneratedAnyAudio) {
      void prefetchUrl(message._id, async () => {
        const url = await getAudioUrl(message._id, convex)
        return url
      })
    }
  }, [message._id, messageToView.hasGeneratedAnyAudio, prefetchUrl, convex])

  return (
    <div key={message._id} className="flex items-start gap-4">
      <div className="text-muted-foreground w-8 text-center text-sm">
        {index + 1}
      </div>
      <VoiceMessageView
        message={messageToView}
        text={text}
        isPlaying={state.currentMessageId === message._id}
        onTextChange={(text) => {
          setText(text)
          void onMessageChange(message._id, text)
        }}
        onGenerate={() => void handleGenerate({ currentText: text })}
        onPlay={() => void handlePlayMessage()}
        onDelete={() => void handleDeleteMessage(message._id)}
        textareaRef={(element) => {
          setTextareaRef(index, element)
        }}
        onPrefetch={handlePrefetch}
      />
    </div>
  )
}
