import { useRef } from 'react'
import { VoiceSetContext, VoiceSetContextState } from './context'

export function VoiceSetProvider({ children }: { children: React.ReactNode }) {
  const playButtonRef = useRef<VoiceSetContextState['playButtonRef']>(null)
  const focusedMessageRef =
    useRef<VoiceSetContextState['focusedMessageRef']>(null)
  const messagesRefs = useRef<VoiceSetContextState['messagesRefs']>(null)

  return (
    <VoiceSetContext.Provider
      value={{
        focusedMessageRef,
        messagesRefs,
        playButtonRef,
      }}
    >
      {children}
    </VoiceSetContext.Provider>
  )
}
