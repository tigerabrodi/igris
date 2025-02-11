import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon } from 'lucide-react'

export function Header({
  onNameChange,
  initialName,
  onAddMessage,
  onDownloadAll,
  onDeleteSet,
}: {
  onNameChange: (name: string) => void
  initialName: string
  onAddMessage: () => void
  onDownloadAll: () => void
  onDeleteSet: () => void
}) {
  return (
    <div className="border-b p-6">
      <div className="flex items-center justify-between">
        <Input
          defaultValue={initialName}
          onChange={(event) => onNameChange(event.target.value)}
          className="w-[500px] text-4xl font-medium"
        />
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={onAddMessage}>
            <PlusIcon className="size-4" />
          </Button>
          <Button variant="outline" onClick={onDownloadAll}>
            Download all
          </Button>
          <Button variant="destructive" onClick={onDeleteSet} className="ml-10">
            Delete set
          </Button>
        </div>
      </div>
    </div>
  )
}
