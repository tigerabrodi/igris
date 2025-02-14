import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { KeyboardIcon } from 'lucide-react'

const SHORTCUTS: Array<{
  command: string
  description: string
  id: string
}> = [
  {
    command: '⌘ + Enter',
    description: 'Generate audio for current message',
    id: 'generate',
  },
  {
    command: '⌘ + ⇧ + D',
    description: 'Download focused message',
    id: 'download-focused',
  },
  {
    command: '⌘ + ⇧ + A',
    description: 'Download all generated audio',
    id: 'download-all',
  },
  {
    command: '⌘ + ↑',
    description: 'Navigate to previous message',
    id: 'navigate-previous',
  },
  {
    command: '⌘ + ↓',
    description: 'Navigate to next message',
    id: 'navigate-next',
  },
  {
    command: '⌘ + K',
    description: 'Create new message',
    id: 'create-message',
  },
]

type ShortcutProps = {
  command: string
  description: string
}

function Shortcut({ command, description }: ShortcutProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground">{description}</span>
      <code className="bg-muted ml-4 rounded px-2 py-1 font-mono text-sm">
        {command}
      </code>
    </div>
  )
}

export function ShortcutsInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="bg-foreground text-background hover:bg-foreground hover:text-background fixed right-5 bottom-5 p-1.5"
          aria-label="Shortcuts info"
          type="button"
          style={{
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 1), 0 0 0 2px rgba(0, 0, 0, 1)',
          }}
        >
          <KeyboardIcon className="text-background size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/80 flex flex-col gap-4 backdrop-blur-lg sm:max-w-[425px]">
        <DialogTitle className="text-lg font-medium">
          Keyboard Shortcuts
        </DialogTitle>

        <div className="flex flex-col gap-3">
          {SHORTCUTS.map((shortcut) => (
            <Shortcut key={shortcut.id} {...shortcut} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
