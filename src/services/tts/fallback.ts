import type { TTSService, VoiceSettings } from './index';
import type { SpeechSegment, ExperienceVersion, VoiceType } from '@/types';
import { getAudioContext, getGainNode, getEffectsInput, initAudioContext } from '@/lib/audio/audioContext';
import { SCRIPT } from '@/data/script';
import { getVoiceType } from '@/lib/voice/voiceClassification';

/**
 * Pre-recorded audio URLs for offline fallback.
 * Generated from script.ts keys — always in sync with current script.
 */
const PRERECORDED_URLS: Record<string, string> = Object.fromEntries(
  Object.keys(SCRIPT).map(key => [
    key,
    `/audio/prerecorded/${key.toLowerCase()}.mp3`
  ])
);

/**
 * Returns the browser's online status.
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Fallback TTS service that plays pre-recorded audio files.
 * Used when offline or when primary TTS service fails.
 */
export class FallbackTTSService implements TTSService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private cancelled = false;
  private speakGeneration = 0;
  private audioBufferCache = new Map<string, AudioBuffer>();

  constructor(context?: AudioContext) {
    this.audioContext = context || getAudioContext();
  }

  /**
   * Speaks the given segments using pre-recorded audio.
   * Matches segment text against SCRIPT entries to find the correct audio file.
   */
  async speak(
    segments: SpeechSegment[],
    voiceSettings: VoiceSettings,
    scriptKey?: string,
    version?: ExperienceVersion,
    voiceType?: VoiceType,
  ): Promise<void> {
    // Bump generation so stale onended callbacks from previous speak() are ignored
    const generation = ++this.speakGeneration;
    this.cancelled = false;

    // Use provided scriptKey directly, or fall back to text-based lookup
    const resolvedKey = scriptKey || this.findScriptKey(segments);

    if (!resolvedKey) {
      // No match found - fall back to browser SpeechSynthesis
      return this.fallbackToSpeechSynthesis(segments, voiceSettings);
    }

    const resolvedVoiceType = voiceType ?? getVoiceType(resolvedKey);
    const url = this.getPrerecordedUrl(resolvedKey, version, resolvedVoiceType);

    try {
      // Check for cancellation before starting
      if (this.cancelled) {
        throw new Error('Speech cancelled');
      }

      // Initialize audio context if needed
      if (!this.audioContext) {
        this.audioContext = await initAudioContext();
      }

      // Check cache first (versioned key to prevent cross-version contamination)
      const cacheKey = `${version || 'V1'}:${resolvedKey}`;
      let buffer = this.audioBufferCache.get(cacheKey);

      if (!buffer) {
        // Fetch and decode audio
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        buffer = await this.audioContext.decodeAudioData(arrayBuffer);

        // Cache for future use
        this.audioBufferCache.set(cacheKey, buffer);
      }

      // Check for cancellation before playback
      if (this.cancelled) {
        throw new Error('Speech cancelled');
      }

      // Play the audio
      await this.playBuffer(buffer, generation);
    } catch (error) {
      if (this.cancelled || (error instanceof Error && error.message === 'Speech cancelled')) {
        throw new Error('Speech cancelled');
      }
      // If playback fails, fall back to SpeechSynthesis
      return this.fallbackToSpeechSynthesis(segments, voiceSettings);
    }
  }

  /**
   * Cancels current speech playback.
   */
  cancel(): void {
    this.cancelled = true;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped or not started
      }
      this.currentSource = null;
    }
  }

  /**
   * Pre-loads all pre-recorded audio buffers into cache.
   * Note: preloadAll() only preloads V1 (root directory) MP3s.
   * V2 narrative MP3s are loaded on-demand during speak().
   */
  async preloadAll(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = await initAudioContext();
    }

    const promises = Object.entries(PRERECORDED_URLS).map(async ([key, url]) => {
      if (this.audioBufferCache.has(key)) {
        return; // Already cached
      }

      try {
        const response = await fetch(url);
        if (!response.ok) return;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.audioBufferCache.set(key, buffer);
      } catch {
        // Ignore preload failures
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Finds the script key matching the given segments.
   */
  private findScriptKey(segments: SpeechSegment[]): string | null {
    if (segments.length === 0) return null;

    const firstText = segments[0].text;

    // Search through SCRIPT entries for a match
    for (const [key, scriptSegments] of Object.entries(SCRIPT)) {
      if (scriptSegments.length > 0 && scriptSegments[0].text === firstText) {
        return key;
      }
    }

    return null;
  }

  /**
   * Plays an audio buffer using Web Audio API.
   * Uses generation token to ignore stale onended callbacks from previous speak() calls.
   */
  private async playBuffer(buffer: AudioBuffer, generation: number): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    return new Promise((resolve, reject) => {
      if (this.cancelled) {
        reject(new Error('Speech cancelled'));
        return;
      }

      const source = this.audioContext!.createBufferSource();
      source.buffer = buffer;
      // Route through effects chain → GainNode so voice gets phase effects + AnalyserNode reads data
      const effectsInput = getEffectsInput();
      if (effectsInput) {
        source.connect(effectsInput);
      } else {
        source.connect(this.audioContext!.destination);
      }

      this.currentSource = source;

      source.onended = () => {
        // Ignore stale callbacks from previous speak() calls
        if (generation !== this.speakGeneration) return;
        this.currentSource = null;
        if (this.cancelled) {
          reject(new Error('Speech cancelled'));
        } else {
          resolve();
        }
      };

      try {
        source.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Falls back to browser SpeechSynthesis when pre-recorded audio is unavailable.
   */
  private async fallbackToSpeechSynthesis(segments: SpeechSegment[], voiceSettings: VoiceSettings): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      // Server-side or headless — simulate delay
      const totalDuration = segments.reduce(
        (acc, s) => acc + s.text.length * 50 + (s.pauseAfter ?? 0),
        0
      );
      await new Promise(resolve => setTimeout(resolve, Math.min(totalDuration, 500)));
      return;
    }

    // Browser with SpeechSynthesis — use timeout-guarded waitForVoices (TTSR-01)
    const { speakSegments, waitForVoices } = await import('@/lib/audio/speechSynthesis');
    const { VOICE_DIRECTIONS } = await import('@/types');

    const voices = await waitForVoices(3000);

    if (voices.length === 0) {
      // No voices available — simulate duration
      const totalDuration = segments.reduce(
        (acc, s) => acc + s.text.length * 50 + (s.pauseAfter ?? 0),
        0
      );
      await new Promise(resolve => setTimeout(resolve, Math.min(totalDuration, 500)));
      return;
    }

    const voiceDirection = VOICE_DIRECTIONS[voiceSettings.phase];
    return speakSegments(segments, voiceDirection);
  }

  /**
   * Returns the pre-recorded URL for a script key.
   * V2 narrative segments load from /audio/prerecorded/v2/ directory.
   * All other segments (V1, V2 questions) load from /audio/prerecorded/ root.
   */
  private getPrerecordedUrl(
    key: string,
    version: ExperienceVersion = 'V1',
    voiceType: VoiceType = 'VOZ_PERGUNTA',
  ): string {
    if (version === 'V2' && voiceType === 'VOZ_NARRATIVA') {
      return `/audio/prerecorded/v2/${key.toLowerCase()}.mp3`;
    }
    return `/audio/prerecorded/${key.toLowerCase()}.mp3`;
  }
}
