import { useEffect, useRef, useState } from 'react'

import { ROUTES } from '@/lib/constants'
import { handlePromise, Status } from '@/lib/utils'
import { Id } from '@convex/_generated/dataModel'
import { ConvexError } from 'convex/values'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { AudioProvider } from './audio-context/provider'
import { AudioPlayer } from './components/audio-player'
import { DeleteAlertDialog } from './components/delete-alert-dialog'
import { Header } from './components/header'
import { MiniSidebar } from './components/mini-sidebar'
import { VoiceMessage } from './components/voice-message'
import { VoiceSelector } from './components/voice-selector'
import { VoiceSetSkeleton } from './components/voice-set-skeleton'
import { useVoiceSetDetail } from './hooks/voice-set-detail'

const DEBOUNCE_CHANGE_TIMEOUT = 200

export function VoiceSetPage() {
  return (
    <AudioProvider>
      <VoiceSetDetail />
    </AudioProvider>
  )
}

function VoiceSetDetail() {
  const { voiceSetId } = useParams<{ voiceSetId: Id<'voiceSets'> }>()
  console.log('voiceSetId', voiceSetId)

  const navigate = useNavigate()
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
  } = useVoiceSetDetail()

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

  const messageRefs = useRef<Array<HTMLTextAreaElement | null>>([])

  const scrollToMessage = (index: number) => {
    console.log('index', index)
    const textarea = messageRefs.current[index]
    if (textarea) {
      requestAnimationFrame(() => {
        console.log('scrolling and focusing')
        textarea.scrollIntoView({ behavior: 'smooth' })
        textarea.focus()
      })
    }
  }

  const onTriggerDeleteMessage = (messageId: Id<'voiceMessages'>) => {
    setDeleteMessageState((prev) => ({
      ...prev,
      id: messageId,
    }))
  }

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

  const onMessageChange = (messageId: Id<'voiceMessages'>, text: string) => {
    if (updateMessageTimeoutRef.current) {
      clearTimeout(updateMessageTimeoutRef.current)
    }

    updateMessageTimeoutRef.current = setTimeout(() => {
      void updateMessage({ messageId, data: { text } })
    }, DEBOUNCE_CHANGE_TIMEOUT)
  }

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

  const onAddMessage = async () => {
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

    console.log('newMessage', newMessage)

    const newMessageIndex = newMessage.position - 1

    scrollToMessage(newMessageIndex)
  }

  const setTextareaRef = (
    index: number,
    element: HTMLTextAreaElement | null
  ) => {
    messageRefs.current[index] = element
  }

  const onDeleteSet = () => {
    setDeleteSetState((prev) => ({
      ...prev,
      shouldDelete: true,
    }))
  }

  const confirmDeleteSet = async () => {
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
  }

  const onCloseDeleteMessageAlertDialog = () => {
    setDeleteMessageState((prev) => ({
      ...prev,
      id: null,
    }))
  }

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
        onAddMessage={() => void onAddMessage()}
        onDeleteSet={() => void onDeleteSet()}
        onDownloadAll={() => {}}
      />

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
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
        <div className="flex-1 overflow-auto p-6">
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
          onDelete={() => void confirmDeleteMessage()}
          onOpenChange={onCloseDeleteMessageAlertDialog}
          isDeleting={deleteMessageState.status === 'loading'}
        />
      )}

      {deleteSetState.shouldDelete && (
        <DeleteAlertDialog
          onDelete={() => void confirmDeleteSet()}
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
    </div>
  )
}
