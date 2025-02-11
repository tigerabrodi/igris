export function VoiceSetSkeleton() {
  return (
    <div className="flex h-full flex-1 animate-pulse flex-col">
      {/* Header skeleton */}
      <div className="border-b p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="bg-muted h-10 w-[300px] rounded-md" />
          <div className="flex items-center gap-2">
            <div className="bg-muted h-10 w-10 rounded-md" />
            <div className="bg-muted h-10 w-32 rounded-md" />
          </div>
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mini sidebar skeleton */}
        <div className="w-16 border-r p-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-muted mb-2 h-9 rounded" />
          ))}
        </div>

        {/* Messages skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-start gap-4">
                <div className="bg-muted h-6 w-8 rounded" />
                <div className="flex-1">
                  <div className="bg-muted h-[100px] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice selector skeleton */}
        <div className="w-64 border-l p-4">
          <div className="bg-muted h-10 rounded-md" />
        </div>
      </div>
    </div>
  )
}
