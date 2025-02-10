import { Search } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { ROUTES } from '@/lib/constants'
import { api } from '@convex/_generated/api'
import { Doc } from '@convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { generatePath, Link } from 'react-router'

const PLACEHOLDER_SETS_LENGTH = 10

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

function FilteredSetsList({ sets }: { sets: Array<Doc<'voiceSets'>> }) {
  return (
    <div className="flex flex-col gap-2">
      {sets.map((set) => (
        <Link
          key={set._id}
          to={generatePath(ROUTES.voiceSet, {
            voiceSetId: set._id.toString(),
          })}
          className="hover:text-primary text-lg"
        >
          {set.name} ({set.totalMessages})
        </Link>
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
