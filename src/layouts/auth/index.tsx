import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/lib/constants'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '@convex/_generated/api'
import { useConvexAuth, useQuery } from 'convex/react'
import {
  AlertTriangleIcon,
  CheckIcon,
  Loader2Icon,
  LogOutIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { ApiKeyDialog } from './components/api-key-dialog'
import { CreateSetDialog } from './components/create-set-dialog'
import { Sidebar } from './components/sidebar'

export function AuthLayout() {
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false)
  const [isCreateSetDialogOpen, setIsCreateSetDialogOpen] = useState(false)

  const user = useQuery(api.users.getCurrentUser)
  const state = useConvexAuth()
  const isLoading = user === undefined || state.isLoading
  const navigate = useNavigate()

  const { signOut } = useAuthActions()

  useEffect(() => {
    if (!isLoading && user === null) {
      void navigate(ROUTES.authEntry)
    }
  }, [isLoading, user, navigate])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Loader2Icon className="size-10 animate-spin" />
      </div>
    )
  }

  const hasUserApiKey = Boolean(user?.api)

  return (
    <div className="flex w-full flex-1">
      {/* Sidebar */}
      <div className="bg-background flex w-64 flex-col gap-4 border-r p-6">
        <span className="mx-auto mb-6 text-lg font-bold">Igris</span>

        <Sidebar onOpenCreateSetDialog={() => setIsCreateSetDialogOpen(true)} />
        <Separator />

        <Button
          variant="ghost"
          className="flex w-full items-center justify-between px-2 text-sm font-medium"
          onClick={() => setIsApiKeyDialogOpen(true)}
        >
          Set API key
          {hasUserApiKey ? (
            <CheckIcon className="size-4 text-green-500" />
          ) : (
            <AlertTriangleIcon className="size-4 text-red-500" />
          )}
        </Button>

        <div className="mt-auto">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => void signOut()}
          >
            <LogOutIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex flex-1">
        <Outlet />
      </main>

      {isApiKeyDialogOpen && (
        <ApiKeyDialog
          open={isApiKeyDialogOpen}
          onOpenChange={setIsApiKeyDialogOpen}
          hasUserApiKey={hasUserApiKey}
        />
      )}

      {isCreateSetDialogOpen && (
        <CreateSetDialog
          open={isCreateSetDialogOpen}
          onOpenChange={setIsCreateSetDialogOpen}
        />
      )}
    </div>
  )
}
