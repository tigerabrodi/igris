import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Download, Loader2, Play, Trash2, Wand2 } from 'lucide-react'

export type MessageToViewType = {
  isGenerating: boolean
  hasGeneratedAnyAudio: boolean
  isPending: boolean
}

type VoiceMessageViewProps = {
  message: MessageToViewType
  isPlaying: boolean
  onFocus: () => void
  onTextChange: (text: string) => void
  onGenerate: () => void
  onPlay: () => void
  onDelete: () => void
  textareaRef: (element: HTMLTextAreaElement | null) => void
  onPrefetch: () => void
  onDownload: () => void
  isDownloading: boolean
  text: string
}

export function VoiceMessageView({
  message,
  isPlaying,
  onGenerate,
  onPlay,
  onDelete,
  textareaRef,
  text,
  onTextChange,
  onPrefetch,
  onDownload,
  isDownloading,
  onFocus,
}: VoiceMessageViewProps) {
  return (
    <div className="flex flex-1 gap-4">
      <Textarea
        ref={textareaRef}
        value={text}
        disabled={message.isPending}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="Enter your message..."
        onFocus={onFocus}
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
            disabled={!message.hasGeneratedAnyAudio || isDownloading}
            aria-label="Download"
            onClick={onDownload}
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
          </Button>
        </div>
        <Button variant="destructive" className="w-full" onClick={onDelete}>
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}
