import { useHotkeys } from 'react-hotkeys-hook'

const HOTKEYS = {
  generate: 'mod+enter',
  download: 'mod+shift+d',
  downloadAll: 'mod+shift+a',
  navigateUp: 'mod+up',
  navigateDown: 'mod+down',
  createMessage: 'mod+k',
} as const

type UseVoiceSetHotkeysProps = {
  onGenerate: () => Promise<void>
  onDownload: () => void
  onDownloadAll: () => Promise<void>
  onNavigateUp: () => void
  onCreateMessage: () => Promise<void>
  onNavigateDown: () => void
}

export function useVoiceSetHotkeys({
  onGenerate,
  onDownload,
  onDownloadAll,
  onNavigateUp,
  onCreateMessage,
  onNavigateDown,
}: UseVoiceSetHotkeysProps) {
  // When inside a textarea, press cmd+enter to generate
  useHotkeys(
    HOTKEYS.generate,
    (event) => {
      event.preventDefault()
      void onGenerate()
    },
    { enableOnFormTags: true }
  )

  // When doing onDownload, we'll need to figure out which textarea is active
  useHotkeys(
    HOTKEYS.download,
    (event) => {
      event.preventDefault()
      void onDownload()
    },
    {
      enableOnFormTags: true,
    }
  )

  // Download all should be straightforward
  useHotkeys(
    HOTKEYS.downloadAll,
    (event) => {
      event.preventDefault()
      void onDownloadAll()
    },
    { enableOnFormTags: true }
  )

  // For both up and down, we should keep track of the textarea on the outside though
  // When navigating up, we'll need to handle focusing upward
  // If no textarea is focused, we'll just focus on the first one if one exists
  useHotkeys(
    HOTKEYS.navigateUp,
    (event) => {
      event.preventDefault()
      void onNavigateUp()
    },
    {
      enableOnFormTags: true,
    }
  )

  useHotkeys(
    HOTKEYS.navigateDown,
    (event) => {
      event.preventDefault()
      void onNavigateDown()
    },
    {
      enableOnFormTags: true,
    }
  )

  useHotkeys(
    HOTKEYS.createMessage,
    (event) => {
      event.preventDefault()
      void onCreateMessage()
    },
    {
      enableOnFormTags: true,
    }
  )
}
