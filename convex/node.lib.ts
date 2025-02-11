'use node'

import { ConvexError } from 'convex/values'
import { ElevenLabsClient } from 'elevenlabs'
import { PassThrough } from 'stream'
import { ELEVEN_LABS_MODEL } from './elevenlabs.lib'
import { handlePromise } from './lib'

export async function generateAudioFromElevenLabs({
  text,
  voiceId,
  apiKey,
}: {
  text: string
  voiceId: string
  apiKey: string
}): Promise<Blob> {
  const elevenlabsClient = new ElevenLabsClient({ apiKey })

  const [stream, convertError] = await handlePromise(
    elevenlabsClient.textToSpeech.convert(voiceId, {
      text,
      model_id: ELEVEN_LABS_MODEL,
    })
  )

  if (convertError || !stream) {
    throw new ConvexError(
      `Failed to convert text to speech: ${convertError?.message}`
    )
  }

  // Create a PassThrough stream to collect chunks
  const passThrough = new PassThrough()
  const chunks: Array<Buffer> = []

  passThrough.on('data', (chunk: Buffer) => {
    chunks.push(Buffer.from(chunk))
  })

  // Return a promise that resolves when streaming is complete
  return new Promise<Blob>((resolve, reject) => {
    // Type the Promise
    passThrough.on('end', () => {
      const combinedBuffer = Buffer.concat(chunks)
      resolve(new Blob([combinedBuffer], { type: 'audio/mpeg' }))
    })

    passThrough.on('error', (error: Error) => {
      // Type the error
      reject(
        new ConvexError(`Failed to process audio stream: ${error.message}`)
      )
    })

    stream.pipe(passThrough)
  })
}
