'use node'

import { ElevenLabsClient } from 'elevenlabs/Client'
import { ELEVEN_LABS_MODEL } from './elevenlabs.lib'

export async function generateAudioFromElevenLabs({
  text,
  voiceId,
  elevenlabsClient,
}: {
  text: string
  voiceId: string
  elevenlabsClient: ElevenLabsClient
}): Promise<Blob> {
  console.log('Testing with direct conversion, voiceId:', voiceId)

  // Try getting the audio directly without streaming
  const response = await elevenlabsClient.textToSpeech.convert(voiceId, {
    text,
    model_id: ELEVEN_LABS_MODEL,
  })

  // If response is already a Blob, return it
  if (response instanceof Blob) {
    return response
  }

  // If it's a stream, convert to Blob directly
  const chunks = []
  for await (const chunk of response) {
    chunks.push(chunk)
  }

  return new Blob(chunks, { type: 'audio/mpeg' })
}
