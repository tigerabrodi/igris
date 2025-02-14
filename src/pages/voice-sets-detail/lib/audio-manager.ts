export class AudioManager {
  private audioElement: HTMLAudioElement
  private currentMessageId: string | null = null
  private messageUrlCache: Map<string, string> = new Map()

  constructor() {
    this.audioElement = new Audio()
    this.setupAudioListeners()
  }

  private setupAudioListeners() {
    this.audioElement.addEventListener('timeupdate', () => {
      // Emit progress update
      this.onProgressChange?.(this.audioElement.currentTime)
    })

    this.audioElement.addEventListener('ended', () => {
      this.onEnded?.()
    })

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.onDurationChange?.(this.audioElement.duration)
    })

    this.audioElement.addEventListener('play', () => {
      this.onPlay?.()
    })

    this.audioElement.addEventListener('pause', () => {
      this.onPause?.()
    })
  }

  // Callbacks that can be set by components
  public onProgressChange?: (time: number) => void
  public onDurationChange?: (duration: number) => void
  public onEnded?: () => void
  public onPlay?: () => void
  public onPause?: () => void

  async playMessage(params: {
    messageId: string
    getUrl: () => Promise<string | undefined>
  }) {
    const { messageId, getUrl } = params

    // If it's the same message and ended, restart it
    if (messageId === this.currentMessageId && this.audioElement.ended) {
      this.audioElement.currentTime = 0
      await this.audioElement.play()
      return
    }

    // If it's the same message and paused, resume it
    if (messageId === this.currentMessageId && this.audioElement.paused) {
      await this.audioElement.play()
      return
    }

    // If it's the same message and playing, pause it
    if (messageId === this.currentMessageId && !this.audioElement.paused) {
      this.audioElement.pause()
      return
    }

    // Get URL (from cache or fetch new)
    let url = this.messageUrlCache.get(messageId)
    if (!url) {
      url = await getUrl()
      if (!url) {
        return
      }
      this.messageUrlCache.set(messageId, url)
    }

    this.currentMessageId = messageId
    this.audioElement.src = url
    await this.audioElement.play()
  }

  async prefetchUrl(
    messageId: string,
    getUrl: () => Promise<string | undefined>
  ) {
    // If already in cache, skip
    if (this.messageUrlCache.has(messageId)) {
      return
    }

    const url = await getUrl()
    console.log('prefetchUrl', url)

    if (url) {
      this.messageUrlCache.set(messageId, url)

      // preload the audio
      const preloadAudio = new Audio()
      preloadAudio.src = url
      preloadAudio.load()
    }
  }

  pause() {
    this.audioElement.pause()
  }

  seek(time: number) {
    this.audioElement.currentTime = time
  }

  // Call this when switching voice sets
  clearCache() {
    this.messageUrlCache.clear()
    this.currentMessageId = null
    this.audioElement.src = ''
  }
}
