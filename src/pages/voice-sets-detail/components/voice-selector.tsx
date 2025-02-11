import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { ELEVEN_LABS_VOICES } from '@convex/elevenlabs.lib'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'

export function VoiceSelector({ setId }: { setId: Id<'voiceSets'> }) {
  const voiceSet = useQuery(api.sets.getSetById, {
    id: setId,
  })

  const updateVoiceSet = useMutation(api.sets.updateSet)

  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)

  useEffect(() => {
    if (voiceSet) {
      setSelectedVoice(voiceSet.selectedVoiceId)
    }
  }, [voiceSet])

  function handleVoiceChange(value: string) {
    setSelectedVoice(value)

    // just update the db in the background
    // should be quick enough
    void updateVoiceSet({
      id: setId,
      data: {
        selectedVoiceId: value,
      },
    })
  }

  const voices = Object.values(ELEVEN_LABS_VOICES)

  return (
    <div className="w-64 border-l p-4">
      <Select
        value={selectedVoice ?? voices[0].id}
        onValueChange={handleVoiceChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              {voice.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
