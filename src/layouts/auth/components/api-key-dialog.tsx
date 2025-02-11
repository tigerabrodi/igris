import { KeyRound } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { InputWithFeedback } from '@/components/input-with-feedback'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { handlePromise } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { useAction } from 'convex/react'

const API_KEY_FORM_NAME = 'apiKey'

type ApiKeyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormState =
  | {
      status: 'error'
      error: string
    }
  | {
      status: 'success'
    }
  | {
      status: 'idle'
    }

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const getApiKey = useAction(api.key.getApiKey)
  const storeApiKey = useAction(api.key.storeApiKey)

  const [apiKey, setApiKey] = useState('')
  const [fetchExistingKeyStatus, setFetchExistingKeyStatus] = useState<
    'idle' | 'loading' | 'error' | 'success'
  >('idle')
  const [fetchExistingKeyErrorMessage, setFetchExistingKeyErrorMessage] =
    useState('')

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const apiKey = formData.get(API_KEY_FORM_NAME) as string

      const [, error] = await handlePromise(storeApiKey({ apiKey }))

      if (error) {
        return {
          status: 'error',
          error: 'Failed to save API key. Please try again.',
        }
      }

      toast.success('API key saved successfully')
      onOpenChange(false)

      return {
        status: 'success',
      }
    },
    { status: 'idle' }
  )

  useEffect(() => {
    if (open) {
      // Fetch API key when dialog opens
      setFetchExistingKeyStatus('loading')
      getApiKey()
        .then((key) => {
          if (key) setApiKey(key)
          setFetchExistingKeyStatus('success')
        })
        .catch(() => {
          setFetchExistingKeyErrorMessage(
            'Failed to fetch existing API key. Please try again.'
          )
          setFetchExistingKeyStatus('error')
        })
    }
  }, [open, getApiKey])

  const isError = fetchExistingKeyStatus === 'error' || state.status === 'error'
  const errorMessage =
    fetchExistingKeyStatus === 'error'
      ? fetchExistingKeyErrorMessage
      : state.status === 'error'
        ? state.error
        : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Set your ElevenLabs API Key
            </DialogTitle>
            <DialogDescription className="pl-7">
              Your API key will be encrypted and stored securely. We never share
              or use your key for anything other than generating voices.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label htmlFor={API_KEY_FORM_NAME}>API Key</Label>
            <InputWithFeedback
              value={apiKey}
              disabled={fetchExistingKeyStatus === 'loading'}
              onChange={(event) => setApiKey(event.target.value)}
              name={API_KEY_FORM_NAME}
              id={API_KEY_FORM_NAME}
              type="password"
              placeholder="Enter your ElevenLabs API key"
              errorMessage={errorMessage}
              isError={isError}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} isLoading={isPending}>
              Save API Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
