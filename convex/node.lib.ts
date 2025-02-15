'use node'

import { ElevenLabsClient } from 'elevenlabs/Client'
import { ELEVEN_LABS_MODEL } from './elevenlabs.lib'

export async function generateAudioFromElevenLabs({
  text,
  voiceId,
  apiKey,
}: {
  text: string
  voiceId: string
  apiKey: string
}): Promise<Blob> {
  const elevenLabsClient = new ElevenLabsClient({
    apiKey,
  })

  // Try getting the audio directly without streaming
  const response = await elevenLabsClient.textToSpeech.convert(voiceId, {
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
