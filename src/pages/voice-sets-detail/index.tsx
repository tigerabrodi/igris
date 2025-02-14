import { ROUTES } from '@/lib/constants'
import { handlePromise, slugify, Status } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useConvex } from 'convex/react'
import { ConvexError } from 'convex/values'
import JSZip from 'jszip'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useAudioContext } from './audio-context/context'
import { AudioProvider } from './audio-context/provider'
import { AudioPlayer } from './components/audio-player'
import { DeleteAlertDialog } from './components/delete-alert-dialog'
import { Header } from './components/header'
import { MiniSidebar } from './components/mini-sidebar'
import { ShortcutsInfoDialog } from './components/shortcuts-info-dialog'
import { VoiceMessage } from './components/voice-message'
import { VoiceSelector } from './components/voice-selector'
import { VoiceSetSkeleton } from './components/voice-set-skeleton'
import { useVoiceOperations } from './hooks/voice-operation'
import { useVoiceSetConvex } from './hooks/voice-set-convex'
import { useVoiceSetHotkeys } from './hooks/voice-set-hot-keys'
import { downloadBlob, getAudioUrl } from './lib/utils'
import { MessageRef, useVoiceSetContext } from './set-context/context'
import { VoiceSetProvider } from './set-context/provider'

const DEBOUNCE_CHANGE_TIMEOUT = 200

export function VoiceSetPage() {
  return (
    <AudioProvider>
      <VoiceSetProvider>
        <VoiceSetDetail />
      </VoiceSetProvider>
    </AudioProvider>
  )
}

function VoiceSetDetail() {
  const { voiceSetId } = useParams<{ voiceSetId: Id<'voiceSets'> }>()
  const convex = useConvex()
  const navigate = useNavigate()

  // State
  const [deleteMessageState, setDeleteMessageState] = useState<{
    id: Id<'voiceMessages'> | null
    status: Status
  }>({
    id: null,
    status: 'idle',
  })

  const [deleteSetState, setDeleteSetState] = useState<{
    shouldDelete: boolean
    status: Status
  }>({
    shouldDelete: false,
    status: 'idle',
  })

  const [downloadAllStatus, setDownloadAllStatus] = useState<Status>('idle')

  // Used when adding a new message
  const [newMessageToFocusIndex, setNewMessageToFocusIndex] = useState<
    number | null
  >(null)

  // Refs
  const updateNameTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const updateMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    voiceSet,
    messages,
    deleteMessage,
    createMessage,
    updateMessage,
    updateVoiceSet,
    deleteSet,
  } = useVoiceSetConvex()

  const { messagesRefs, focusedMessageRef } = useVoiceSetContext()
  const { playMessage } = useAudioContext()

  const { handleGenerateForFocused, handleDownloadForFocused } =
    useVoiceOperations()

  function handleNavigate(direction: 'up' | 'down') {
    if (!messagesRefs.current) return

    // If no message is focused, focus on the first message
    // This lets you start navigating right away with the keyboard instead of clicking with mouse first
    // We do the same on down navigation as well
    const focusedMessage = focusedMessageRef.current
    if (!focusedMessage) {
      const firstMessageRef = messagesRefs.current[0]
      if (!firstMessageRef) return
      focusedMessageRef.current = firstMessageRef
      scrollToMessage(firstMessageRef.index)
      return
    }

    const length = messagesRefs.current.length
    const currentIndex = focusedMessage.index

    // Calculate new index with proper wrapping
    const newIndex =
      direction === 'up'
        ? (currentIndex - 1 + length) % length // Add length before modulo for negative numbers
        : (currentIndex + 1) % length

    const newMessageRef = messagesRefs.current[newIndex]
    if (!newMessageRef) return

    focusedMessageRef.current = newMessageRef
    scrollToMessage(newMessageRef.index)
  }

  useVoiceSetHotkeys({
    onGenerate: async () => {
      const messageId = await handleGenerateForFocused()
      if (!messageId) return

      await playMessage({
        messageId,
        getUrl: async () => {
          const url = await getAudioUrl(messageId, convex)
          return url
        },
      })
    },
    onDownload: () => {
      void handleDownloadForFocused()
    },
    onDownloadAll: () => {
      void onDownloadAll()
    },
    onNavigateUp: () => {
      handleNavigate('up')
    },
    onNavigateDown: () => {
      handleNavigate('down')
    },
    onCreateMessage: () => {
      void onAddMessage()
    },
  })

  const scrollToMessage = useCallback(
    (index: number) => {
      const messageRef = messagesRefs.current?.[index]
      if (!messageRef) return

      console.log('focusing', messageRef.textareaElement)

      messageRef.textareaElement.focus()
      messageRef.textareaElement.select()

      const rect = messageRef.textareaElement.getBoundingClientRect()
      const isInViewport =
        rect.top >= 0 && // Element's top edge is below the viewport's top
        rect.left >= 0 && // Element's left edge is after viewport's left edge
        rect.bottom <= window.innerHeight && // Element's bottom edge is above viewport's bottom
        rect.right <= window.innerWidth // Element's right edge is before viewport's right

      // If in viewport already, not a nice experience to have scrolling happen
      if (!isInViewport) {
        messageRef.textareaElement.scrollIntoView({ behavior: 'smooth' })
      }
    },
    [messagesRefs]
  )

  useEffect(() => {
    // 1. Focus and scroll to new message
    // 2. Select text so it's easy to edit
    if (newMessageToFocusIndex !== null) {
      scrollToMessage(newMessageToFocusIndex)
      setNewMessageToFocusIndex(null)
    }
  }, [messagesRefs, newMessageToFocusIndex, scrollToMessage])

  useEffect(() => {
    // cleanup timeouts
    return () => {
      if (updateNameTimeoutRef.current) {
        clearTimeout(updateNameTimeoutRef.current)
      }

      if (updateMessageTimeoutRef.current) {
        clearTimeout(updateMessageTimeoutRef.current)
      }
    }
  }, [])

  const onTriggerDeleteMessage = useCallback(
    (messageId: Id<'voiceMessages'>) => {
      setDeleteMessageState((prev) => ({
        ...prev,
        id: messageId,
      }))
    },
    [setDeleteMessageState]
  )

  // Deletion isn't something that happens too often
  // We should communicate how a destructive action went
  const confirmDeleteMessage = async () => {
    if (!deleteMessageState.id) return

    setDeleteMessageState((prev) => ({
      ...prev,
      status: 'loading',
    }))

    const [, deleteError] = await handlePromise(
      deleteMessage({
        messageId: deleteMessageState.id,
        setId: voiceSetId as Id<'voiceSets'>,
      })
    )

    if (deleteError) {
      setDeleteMessageState((prev) => ({
        ...prev,
        id: null,
        status: 'error',
      }))
      toast.error('Failed to delete message')
    } else {
      setDeleteMessageState((prev) => ({
        ...prev,
        id: null,
        status: 'success',
      }))
      toast.success('Message deleted')
    }

    setDeleteMessageState((prev) => ({
      ...prev,
      id: null,
      status: 'idle',
    }))
  }

  const onNameChange = (name: string) => {
    if (updateNameTimeoutRef.current) {
      clearTimeout(updateNameTimeoutRef.current)
    }

    updateNameTimeoutRef.current = setTimeout(() => {
      void updateVoiceSet({
        id: voiceSetId as Id<'voiceSets'>,
        data: { name },
      })
    }, DEBOUNCE_CHANGE_TIMEOUT)
  }

  const onMessageChange = useCallback(
    (messageId: Id<'voiceMessages'>, text: string) => {
      if (updateMessageTimeoutRef.current) {
        clearTimeout(updateMessageTimeoutRef.current)
      }

      updateMessageTimeoutRef.current = setTimeout(() => {
        void updateMessage({ messageId, data: { text } })
      }, DEBOUNCE_CHANGE_TIMEOUT)
    },
    [updateMessage]
  )

  const onAddMessage = useCallback(async () => {
    const [newMessage, createError] = await handlePromise(
      createMessage({
        setId: voiceSetId as Id<'voiceSets'>,
      })
    )

    // If error should be communicated
    // Typical expectation is success, and because it's common, leaving out success toast message
    if (createError || !newMessage) {
      toast.error('Failed to create message')
      return
    }

    setNewMessageToFocusIndex(newMessage.position - 1)
  }, [createMessage, voiceSetId])

  const setTextareaRef = useCallback(
    ({
      index,
      textareaElement,
      id,
    }: {
      index: number
      textareaElement: HTMLTextAreaElement | null
      id: Id<'voiceMessages'>
    }) => {
      // Should not happen
      if (!textareaElement) return

      // Initialize if not initialized
      if (!messagesRefs.current) {
        messagesRefs.current = []
      }

      const newMessageRef: MessageRef = {
        id,
        textareaElement,
        index,
      }

      messagesRefs.current[index] = newMessageRef
    },
    [messagesRefs]
  )

  const onDeleteSet = useCallback(() => {
    setDeleteSetState((prev) => ({
      ...prev,
      shouldDelete: true,
    }))
  }, [])

  const confirmDeleteSet = useCallback(async () => {
    setDeleteSetState((prev) => ({
      ...prev,
      status: 'loading',
    }))

    const [, deleteError] = await handlePromise(
      deleteSet({ id: voiceSetId as Id<'voiceSets'> })
    )

    if (deleteError) {
      if (deleteError instanceof ConvexError) {
        setDeleteSetState((prev) => ({
          ...prev,
          status: 'error',
        }))
        toast.error(deleteError.message)
        return
      }

      setDeleteSetState((prev) => ({
        ...prev,
        status: 'error',
      }))
      toast.error('Failed to delete set')
      return
    }

    setDeleteSetState((prev) => ({
      ...prev,
      status: 'success',
    }))
    toast.success('Set deleted')
    void navigate(ROUTES.voiceSets)
  }, [deleteSet, navigate, voiceSetId])

  const onCloseDeleteMessageAlertDialog = () => {
    setDeleteMessageState((prev) => ({
      ...prev,
      id: null,
    }))
  }

  const onDownloadAll = useCallback(async () => {
    if (!voiceSet) return

    setDownloadAllStatus('loading')

    const getFilesPromise = convex.query(api.sets.getSetAudioFiles, {
      setId: voiceSetId!,
    })
    const [files, filesError] = await handlePromise(getFilesPromise)

    console.log('error', filesError)

    if (filesError) {
      setDownloadAllStatus('error')
      toast.error('Failed to download all files')
      return
    }

    if (files.length === 0) {
      setDownloadAllStatus('success')
      toast.success('No files to download')
      return
    }

    const zip = new JSZip()

    const allDownloadPromises = files.map(async (file) => {
      if (!file.audioUrl) return

      const response = await fetch(file.audioUrl)
      const blob = await response.blob()
      const filename = `${slugify(voiceSet.name)}-${file.position}.mp3`
      zip.file(filename, blob)
    })

    const [, downloadError] = await handlePromise(
      Promise.all(allDownloadPromises)
    )

    if (downloadError) {
      setDownloadAllStatus('error')
      toast.error('Failed to download all files')
      return
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, `${slugify(voiceSet.name)}.zip`)

    // Should be noticable downloading in the browser
    // No need to communicate success
    setDownloadAllStatus('success')
  }, [convex, voiceSet, voiceSetId])

  // loading
  if (voiceSet === undefined) {
    return <VoiceSetSkeleton />
  }

  // not found
  if (voiceSet === null) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-medium">No set found</div>
          <div className="text-sm text-gray-500">
            This voice set doesn&apos;t exist.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <Header
        onNameChange={onNameChange}
        initialName={voiceSet.name}
        onAddMessage={onAddMessage}
        onDeleteSet={onDeleteSet}
        onDownloadAll={onDownloadAll}
        isDownloadingAll={downloadAllStatus === 'loading'}
      />

      {/* Content area */}
      <div className="flex flex-1">
        {/* Mini sidebar */}
        <div className="w-16 overflow-y-auto border-r p-2">
          {messages?.map((_, index) => (
            <MiniSidebar
              key={index}
              index={index}
              onClick={() => scrollToMessage(index)}
            />
          ))}
        </div>

        {/* Messages */}
        <div className="min-h-full flex-1 overflow-y-auto p-6 pb-28">
          <div className="flex flex-col gap-10">
            {messages && messages.length > 0 ? (
              messages.map((message, index) => {
                return (
                  <VoiceMessage
                    key={message._id}
                    message={message}
                    index={index}
                    onMessageChange={onMessageChange}
                    handleDeleteMessage={onTriggerDeleteMessage}
                    setTextareaRef={setTextareaRef}
                  />
                )
              })
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-muted-foreground">
                  No messages found. Add one!
                </p>
              </div>
            )}
          </div>
        </div>

        <VoiceSelector setId={voiceSetId!} />
        <AudioPlayer />
      </div>

      {deleteMessageState.id && (
        <DeleteAlertDialog
          isOpen={!!deleteMessageState.id}
          title="Delete this message?"
          description="This action cannot be undone. This will permanently delete your
            message and its generated audio."
          onDelete={confirmDeleteMessage}
          onOpenChange={onCloseDeleteMessageAlertDialog}
          isDeleting={deleteMessageState.status === 'loading'}
        />
      )}

      {deleteSetState.shouldDelete && (
        <DeleteAlertDialog
          onDelete={confirmDeleteSet}
          onOpenChange={() =>
            setDeleteSetState((prev) => ({
              ...prev,
              shouldDelete: false,
            }))
          }
          isDeleting={deleteSetState.status === 'loading'}
          isOpen={deleteSetState.shouldDelete}
          title="Delete this set?"
          description="This action cannot be undone. This will permanently delete your
            set and all its messages."
        />
      )}

      <ShortcutsInfoDialog />
    </div>
  )
}
