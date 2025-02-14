import { Pause, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useConvex } from 'convex/react'
import { useAudioContext } from '../audio-context/context'
import { formatTime, getAudioUrl } from '../lib/utils'
import { useVoiceSetContext } from '../set-context/context'

export function AudioPlayer() {
  const { state, playMessage, seek } = useAudioContext()
  const { currentMessageId, isPlaying, progress, duration } = state
  const convex = useConvex()
  const { playButtonRef } = useVoiceSetContext()

  if (!currentMessageId) return null

  const handlePlayMessage = () => {
    void playMessage({
      messageId: currentMessageId,
      getUrl: async () => {
        const url = await getAudioUrl(currentMessageId, convex)
        return url
      },
    })
  }

  return (
    <div className="bg-background fixed right-0 bottom-0 left-0 border-t p-4">
      <div className="mx-auto flex max-w-3xl items-center gap-4">
        <Button ref={playButtonRef} onClick={handlePlayMessage}>
          {isPlaying ? <Pause /> : <Play />}
        </Button>

        <div>{formatTime(progress)}</div>

        <Slider
          value={[progress]}
          max={duration}
          step={0.1}
          onValueChange={([value]) => seek(value)}
        />

        <div>{formatTime(duration)}</div>
      </div>
    </div>
  )
}
