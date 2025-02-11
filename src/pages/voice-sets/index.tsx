import { Search } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { usePrefetchQuery } from '@/hooks/use-prefetch-query'
import { ROUTES } from '@/lib/constants'
import { api } from '@convex/_generated/api'
import { Doc } from '@convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { generatePath, Link } from 'react-router'

const PLACEHOLDER_SETS_LENGTH = 10
const PRE_FETCH_TIMEOUT_MS = 5000

function PlaceholderSetsList() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: PLACEHOLDER_SETS_LENGTH }).map((_, index) => (
        <div
          key={index}
          className="bg-muted h-6 w-1/2 animate-pulse rounded-md"
        />
      ))}
    </div>
  )
}

function VoiceSetItem({ set }: { set: Doc<'voiceSets'> }) {
  // We don't need a long timeout here for prefetching
  // We can assume user is fast to click and no need to keep the pre subscription open for tool long

  const prefetchVoiceSet = usePrefetchQuery(
    api.sets.getSetById,
    {
      id: set._id,
    },
    {
      timeoutMs: PRE_FETCH_TIMEOUT_MS,
    }
  )

  const prefetchMessages = usePrefetchQuery(
    api.messages.getAllMessagesBySetId,
    {
      setId: set._id,
    },
    {
      timeoutMs: PRE_FETCH_TIMEOUT_MS,
    }
  )

  const handlePrefetch = () => {
    prefetchVoiceSet()
    prefetchMessages()
  }

  return (
    <Link
      key={set._id}
      to={generatePath(ROUTES.voiceSet, {
        voiceSetId: set._id.toString(),
      })}
      className="hover:text-primary text-lg"
      onMouseEnter={handlePrefetch}
    >
      {set.name} ({set.totalMessages})
    </Link>
  )
}

function FilteredSetsList({ sets }: { sets: Array<Doc<'voiceSets'>> }) {
  return (
    <div className="flex flex-col gap-2">
      {sets.map((set) => (
        <VoiceSetItem key={set._id} set={set} />
      ))}
    </div>
  )
}

function EmptyScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <p className="text-muted-foreground">No voice sets found</p>
    </div>
  )
}

function SetsContent({
  sets,
  filteredSets,
}: {
  sets: Array<Doc<'voiceSets'>> | undefined
  filteredSets: Array<Doc<'voiceSets'>> | undefined
}) {
  if (sets === undefined) {
    return <PlaceholderSetsList />
  }

  if (!filteredSets?.length) {
    return <EmptyScreen />
  }

  return <FilteredSetsList sets={filteredSets} />
}

export function VoiceSetsPage() {
  const sets = useQuery(api.sets.getAllSets)
  const [search, setSearch] = useState('')

  const filteredSets = sets?.filter((set) =>
    set.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col gap-10 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Voice Sets</h1>
        <div className="relative w-64">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search voice sets..."
            className="pl-8"
            disabled={sets === undefined}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <SetsContent sets={sets} filteredSets={filteredSets} />
    </div>
  )
}
