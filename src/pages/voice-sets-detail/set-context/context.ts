import { createContext, useCallback, useContext } from 'react'

import { Id } from '@convex/_generated/dataModel'

export type MessageRef = {
  id: Id<'voiceMessages'>
  textareaElement: HTMLTextAreaElement
  index: number
}

export type VoiceSetContextState = {
  focusedMessageRef: MessageRef | null
  messagesRefs: Array<MessageRef> | null
  playButtonRef: HTMLButtonElement | null
}

export type VoiceSetContextType = {
  focusedMessageRef: React.RefObject<VoiceSetContextState['focusedMessageRef']>
  messagesRefs: React.RefObject<VoiceSetContextState['messagesRefs']>
  playButtonRef: React.RefObject<VoiceSetContextState['playButtonRef']>
}

export const VoiceSetContext = createContext<VoiceSetContextType | null>(null)

export function useVoiceSetContext() {
  const context = useContext(VoiceSetContext)
  if (!context) {
    throw new Error('useVoiceSet must be used within VoiceSetProvider')
  }

  const isMessageFocused = useCallback(() => {
    if (!context.focusedMessageRef.current) return false
    if (!context.focusedMessageRef.current.textareaElement) return false

    return (
      context.focusedMessageRef.current.textareaElement ===
      document.activeElement
    )
  }, [context.focusedMessageRef])

  return {
    ...context,
    isMessageFocused,
  }
}
