import { ERROR_TOAST_DURATION } from '@/lib/constants'
import { handlePromise } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { ConvexReactClient } from 'convex/react'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

export function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  // padStart to make sure we always have the format {mins}:{secs} e.g. 1:05
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export async function getAudioUrl(
  messageId: Id<'voiceMessages'>,
  convex: ConvexReactClient
) {
  const [url, getUrlError] = await handlePromise(
    convex.query(api.messages.getAudioUrl, {
      messageId: messageId,
    })
  )

  if (getUrlError) {
    if (getUrlError instanceof ConvexError) {
      toast.error(getUrlError.message, {
        duration: ERROR_TOAST_DURATION,
      })
    } else {
      toast.error('Failed to get audio URL', {
        duration: ERROR_TOAST_DURATION,
      })
    }

    return
  }

  if (!url) {
    toast.error('No audio URL found', {
      duration: ERROR_TOAST_DURATION,
    })
    return
  }

  return url
}

export function downloadBlob(blob: Blob, filename: string) {
  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

  // Create a temporary link
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  // Append to body, click, and cleanup
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Release the URL object
  URL.revokeObjectURL(url)
}
