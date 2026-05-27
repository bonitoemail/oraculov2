import type { TTSService, VoiceSettings } from './index';
import { PLAYBACK_RATE } from './index';
import type { SpeechSegment, ExperienceVersion, VoiceType } from '@/types';
import { getAudioContext, getEffectsInput, initAudioContext } from '@/lib/audio/audioContext';
import { FallbackTTSService } from './fallback';

/**
 * ElevenLabs TTS service.
 * Uses HTMLAudioElement for playback so that playbackRate changes speed
 * without affecting pitch (preservesPitch=true by default in modern browsers).
 */
export class ElevenLabsTTSService implements TTSService {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private cancelled = false;
  private fallbackService: TTSService;

  constructor() {
    this.fallbackService = new FallbackTTSService();
  }

  async speak(
    segments: SpeechSegment[],
    voiceSettings: VoiceSettings,
    scriptKey?: string,
    version?: ExperienceVersion,
    voiceType?: VoiceType,
  ): Promise<void> {
    this.cancelled = false;

    try {
      // Join all segment texts into one TTS call
      const text = segments.map(s => s.text).join(' ');

      // Call /api/tts with voice settings (RTTS-01, RTTS-02)
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity_boost,
            style: voiceSettings.style,
            ...(voiceSettings.speed != null ? { speed: voiceSettings.speed } : {}),
          },
          ...(version ? { version } : {}),
          ...(scriptKey ? { script_key: scriptKey } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      if (this.cancelled) {
        throw new Error('Speech cancelled');
      }

      // Get audio blob and create object URL
      const audioBlob = await response.blob();
      const blobUrl = URL.createObjectURL(audioBlob);

      try {
        // Initialize audio context if needed
        if (!this.audioContext) {
          this.audioContext = getAudioContext() || await initAudioContext();
        }

        if (this.cancelled) {
          throw new Error('Speech cancelled');
        }

        // Play using HTMLAudioElement (pitch-preserved speed)
        await this.playUrl(blobUrl);
      } finally {
        URL.revokeObjectURL(blobUrl);
        this.currentBlobUrl = null;
      }
    } catch (error) {
      if (this.cancelled || (error instanceof Error && error.message === 'Speech cancelled')) {
        throw new Error('Speech cancelled');
      }
      console.warn('[ElevenLabs] API failed, using fallback:', error);
      return this.fallbackService.speak(segments, voiceSettings, scriptKey, version, voiceType);
    }
  }

  cancel(): void {
    this.cancelled = true;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Already stopped
      }
      this.currentAudio = null;
    }
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  /**
   * Plays audio from a URL using HTMLAudioElement for pitch-preserved speed control.
   * Routes through the Web Audio effects chain via MediaElementAudioSourceNode.
   */
  private async playUrl(url: string): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    return new Promise((resolve, reject) => {
      if (this.cancelled) {
        reject(new Error('Speech cancelled'));
        return;
      }

      const audio = new Audio(url);
      audio.playbackRate = PLAYBACK_RATE;
      // preservesPitch defaults to true in Chrome/Firefox/Safari
      audio.preservesPitch = true;
      this.currentAudio = audio;
      this.currentBlobUrl = url;

      // Route through effects chain for phase EQ/reverb
      try {
        const mediaSource = this.audioContext!.createMediaElementSource(audio);
        const effectsInput = getEffectsInput();
        if (effectsInput) {
          mediaSource.connect(effectsInput);
        } else {
          mediaSource.connect(this.audioContext!.destination);
        }
      } catch {
        // If MediaElementSource fails, let audio play through default output
      }

      audio.onended = () => {
        this.currentAudio = null;
        if (this.cancelled) {
          reject(new Error('Speech cancelled'));
        } else {
          resolve();
        }
      };

      audio.onerror = () => {
        this.currentAudio = null;
        reject(new Error(`Failed to play audio: ${url}`));
      };

      // Resume AudioContext if suspended (mobile browsers suspend after inactivity).
      // Fire-and-forget: don't await, as resume() can hang on mobile without user gesture.
      this.audioContext!.resume().catch(() => {});
      audio.play().catch((err) => {
        console.warn('[ElevenLabs] audio.play() failed:', err.name, err.message);
        this.currentAudio = null;
        reject(err);
      });
    });
  }
}
