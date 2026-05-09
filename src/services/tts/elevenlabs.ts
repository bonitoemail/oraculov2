import type { TTSService, VoiceSettings } from './index';
import type { SpeechSegment, ExperienceVersion, VoiceType } from '@/types';
import { getAudioContext, getEffectsInput, initAudioContext } from '@/lib/audio/audioContext';
import { FallbackTTSService } from './fallback';

export class ElevenLabsTTSService implements TTSService {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
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
      const audioUrl = URL.createObjectURL(audioBlob);

      try {
        // Initialize audio context if needed
        if (!this.audioContext) {
          this.audioContext = getAudioContext() || await initAudioContext();
        }

        // Decode audio data
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        if (this.cancelled) {
          throw new Error('Speech cancelled');
        }

        // Play using Web Audio API (same pattern as FallbackTTSService)
        await this.playBuffer(audioBuffer);
      } finally {
        URL.revokeObjectURL(audioUrl);
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
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped
      }
      this.currentSource = null;
    }
  }

  private async playBuffer(buffer: AudioBuffer): Promise<void> {
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
        this.currentSource = null;
        if (this.cancelled) {
          reject(new Error('Speech cancelled'));
        } else {
          resolve();
        }
      };

      try {
        source.start();
      } catch (err) {
        reject(err);
      }
    });
  }
}
