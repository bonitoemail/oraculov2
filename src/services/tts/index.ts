import type { SpeechSegment, NarrativePhase, ExperienceVersion, VoiceType } from '@/types';
import { MockTTSService } from './mock';
import { FallbackTTSService, isOnline } from './fallback';
import { ElevenLabsTTSService } from './elevenlabs';

export interface VoiceSettings {
  stability: number;        // 0-1, ElevenLabs parameter
  similarity_boost: number; // 0-1, ElevenLabs parameter
  style: number;            // 0-1, ElevenLabs parameter
  speed?: number;           // 0.5-2.0, ElevenLabs parameter -- optional (v3 does not support speed)
  phase: NarrativePhase;    // For mock routing to VoiceDirection
}

export const PHASE_VOICE_SETTINGS: Record<NarrativePhase, VoiceSettings> = {
  APRESENTACAO: { stability: 0.5, similarity_boost: 0.8, style: 0.3, speed: 0.9, phase: 'APRESENTACAO' },
  INFERNO: { stability: 0.7, similarity_boost: 0.9, style: 0.5, speed: 0.8, phase: 'INFERNO' },
  PURGATORIO: { stability: 0.4, similarity_boost: 0.8, style: 0.4, speed: 0.9, phase: 'PURGATORIO' },
  PARAISO: { stability: 0.3, similarity_boost: 0.7, style: 0.2, speed: 0.85, phase: 'PARAISO' },
  DEVOLUCAO: { stability: 0.4, similarity_boost: 0.8, style: 0.3, speed: 0.85, phase: 'DEVOLUCAO' },
  ENCERRAMENTO: { stability: 0.5, similarity_boost: 0.8, style: 0.3, speed: 0.9, phase: 'ENCERRAMENTO' },
};

export interface TTSService {
  speak(
    segments: SpeechSegment[],
    voiceSettings: VoiceSettings,
    scriptKey?: string,
    version?: ExperienceVersion,
    voiceType?: VoiceType,
  ): Promise<void>;
  cancel(): void;
}

export function createTTSService(): TTSService {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_REAL_APIS === 'true') {
    return new ElevenLabsTTSService();
  }
  return new FallbackTTSService();
}

export function createFallbackTTSService(): TTSService {
  return new FallbackTTSService();
}
