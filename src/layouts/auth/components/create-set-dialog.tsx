import { useActionState, useState } from 'react'

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
import { ROUTES } from '@/lib/constants'
import { handlePromise } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { useMutation } from 'convex/react'
import { generatePath, useNavigate } from 'react-router'

const CREATE_SET_FORM_NAME = 'create-set'

type CreateSetDialogProps = {
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

export function CreateSetDialog({ open, onOpenChange }: CreateSetDialogProps) {
  const [title, setTitle] = useState('')

  const createSet = useMutation(api.sets.createSet)
  const navigate = useNavigate()

  const [, formAction, isPending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const title = formData.get(CREATE_SET_FORM_NAME) as string

      const [newSetId, error] = await handlePromise(createSet({ name: title }))

      if (error) {
        return {
          status: 'error',
          error: 'Failed to save API key. Please try again.',
        }
      }

      onOpenChange(false)
      void navigate(generatePath(ROUTES.voiceSet, { voiceSetId: newSetId }))

      return {
        status: 'success',
      }
    },
    { status: 'idle' }
  )

  const isTitleEmpty = title.trim() === ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Create New Voice Set
            </DialogTitle>

            <DialogDescription className="sr-only">
              Create a new voice set to store your voices.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={CREATE_SET_FORM_NAME}>Set Title</Label>
            <InputWithFeedback
              id={CREATE_SET_FORM_NAME}
              name={CREATE_SET_FORM_NAME}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isTitleEmpty} isLoading={isPending}>
              Create Set
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
