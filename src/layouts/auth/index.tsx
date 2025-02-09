import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/lib/constants'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '@convex/_generated/api'
import { useConvexAuth, useQuery } from 'convex/react'
import {
  AlertTriangleIcon,
  CheckIcon,
  ListIcon,
  Loader2Icon,
  LogOutIcon,
  PlusIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'

export function AuthLayout() {
  const [, setIsApiKeyDialogOpen] = useState(false)
  const [, setIsCreateSetDialogOpen] = useState(false)

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

        <nav className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="w-full justify-start px-2 text-sm font-medium"
            asChild
          >
            <Link to="/voice-sets" className="flex items-center gap-2">
              <ListIcon className="size-4" />
              Voice Sets
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-2 px-2 text-sm font-medium"
            onClick={() => setIsCreateSetDialogOpen(true)}
          >
            <PlusIcon className="size-4" />
            Create new set
          </Button>
        </nav>

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
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* <ApiKeyDialog
        open={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
      />
      <CreateSetDialog
        open={isCreateSetDialogOpen}
        onOpenChange={setIsCreateSetDialogOpen}
      /> */}
    </div>
  )
}
