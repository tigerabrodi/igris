import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { handlePromise, Status } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { ELEVEN_LABS_VOICES } from '@convex/elevenlabs.lib'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function VoiceSelector({ setId }: { setId: Id<'voiceSets'> }) {
  const voiceSet = useQuery(api.sets.getSetById, {
    id: setId,
  })

  const updateVoiceSet = useMutation(api.sets.updateSet)

  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [updateVoiceStatus, setUpdateVoiceStatus] = useState<Status>('idle')

  useEffect(() => {
    if (voiceSet) {
      setSelectedVoice(voiceSet.selectedVoiceId)
    }
  }, [voiceSet])

  async function handleVoiceChange(value: string) {
    setUpdateVoiceStatus('loading')

    setSelectedVoice(value)

    const [, error] = await handlePromise(
      updateVoiceSet({
        id: setId,
        data: {
          selectedVoiceId: value,
        },
      })
    )

    if (error) {
      setUpdateVoiceStatus('error')
      toast.error('Failed to update voice')
      return
    }

    setUpdateVoiceStatus('success')
  }

  const voices = Object.values(ELEVEN_LABS_VOICES)

  return (
    <div className="w-64 border-l p-4">
      <Select
        value={selectedVoice ?? voices[0].id}
        onValueChange={handleVoiceChange}
        disabled={updateVoiceStatus === 'loading'}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              {voice.name} {voice.isLegacy ? '(Legacy)' : '(New)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
