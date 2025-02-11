import { Button } from '@/components/ui/button'

type MiniSidebarProps = {
  index: number
  onClick: () => void
}

export function MiniSidebar({ index, onClick }: MiniSidebarProps) {
  return (
    <Button variant="ghost" className="w-full" onClick={onClick}>
      {index + 1}
    </Button>
  )
}
