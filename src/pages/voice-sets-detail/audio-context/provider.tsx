import { Id } from '@convex/_generated/dataModel'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioManager } from '../lib/audio-manager'
import { AudioContext, AudioState } from './context'

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioState>({
    currentMessageId: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
  })

  const audioManager = useRef<AudioManager>(new AudioManager())

  useEffect(() => {
    // Capture the reference to the audio manager
    const audio = audioManager.current

    audio.onProgressChange = (time) => {
      setState((prev) => ({ ...prev, progress: time }))
    }

    audio.onDurationChange = (duration) => {
      setState((prev) => ({ ...prev, duration }))
    }

    audio.onEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false }))
    }

    // Add play and pause listeners to sync state
    audio.onPlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }))
    }

    audio.onPause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }))
    }

    return () => {
      if (audio) {
        audio.clearCache()
      }
    }
  }, [])

  const playMessage = useCallback(
    async (
      messageId: Id<'voiceMessages'>,
      getUrl: () => Promise<string | undefined>
    ) => {
      await audioManager.current?.playMessage(messageId, getUrl)
      setState((prev) => ({
        ...prev,
        currentMessageId: messageId,
      }))
    },
    []
  )

  const pause = useCallback(() => {
    audioManager.current?.pause()
  }, [])

  const seek = useCallback((time: number) => {
    audioManager.current?.seek(time)
  }, [])

  const prefetchUrl = useCallback(
    async (
      messageId: Id<'voiceMessages'>,
      getUrl: () => Promise<string | undefined>
    ) => {
      await audioManager.current?.prefetchUrl(messageId, getUrl)
    },
    []
  )

  return (
    <AudioContext.Provider
      value={{ state, playMessage, pause, seek, prefetchUrl }}
    >
      {children}
    </AudioContext.Provider>
  )
}
