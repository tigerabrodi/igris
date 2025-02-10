import { Button } from '@/components/ui/button'
import { usePrefetchQuery } from '@/hooks/use-prefetch-query'
import { api } from '@convex/_generated/api'
import { ListIcon, PlusIcon } from 'lucide-react'
import { Link } from 'react-router'

export function Sidebar({
  onOpenCreateSetDialog,
}: {
  onOpenCreateSetDialog: () => void
}) {
  const prefetchSets = usePrefetchQuery(api.sets.getAllSets, {})

  return (
    <nav className="flex flex-col gap-2">
      <Button
        variant="ghost"
        className="w-full justify-start px-2 text-sm font-medium"
        asChild
      >
        <Link
          to="/voice-sets"
          className="flex items-center gap-2"
          onMouseEnter={prefetchSets}
        >
          <ListIcon className="size-4" />
          Voice Sets
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="flex w-full items-center justify-start gap-2 px-2 text-sm font-medium"
        onClick={onOpenCreateSetDialog}
      >
        <PlusIcon className="size-4" />
        Create new set
      </Button>
    </nav>
  )
}
