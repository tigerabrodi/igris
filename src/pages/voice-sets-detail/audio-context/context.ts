import { Id } from '@convex/_generated/dataModel'
import { createContext, useContext } from 'react'

export type AudioState = {
  currentMessageId: Id<'voiceMessages'> | null
  isPlaying: boolean
  progress: number
  duration: number
}

export const AudioContext = createContext<{
  state: AudioState
  playMessage: (
    messageId: Id<'voiceMessages'>,
    getUrl: () => Promise<string | undefined>
  ) => Promise<void>
  pause: () => void
  seek: (time: number) => void
}>({
  state: {
    currentMessageId: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
  },
  playMessage: async () => {},
  pause: () => {},
  seek: () => {},
})

export function useAudioContext() {
  const context = useContext(AudioContext)

  if (!context) {
    throw new Error('useAudioContext must be used within a AudioProvider')
  }

  return context
}
