import { useReducer, useCallback, useRef, useEffect, useDebugValue } from 'react';
import { useMicrophone } from './useMicrophone';
import { createSTTService, type STTService } from '@/services/stt';
import { createNLUService, type NLUService, type ClassificationResult } from '@/services/nlu';
import { createLogger } from '@/lib/debug/logger';

export interface ChoiceConfig {
  /** Context of the question being asked (for NLU) */
  questionContext: string;
  /** The two options for binary classification */
  options: { A: string; B: string };
  /** Keywords for direct matching before LLM call */
  keywords?: { A: string[]; B: string[] };
  /** Map classification result to XState event type */
  eventMap: { A: string; B: string };
  /** Confidence threshold for accepting classification. Default: 0.7 */
  confidenceThreshold?: number;
  /** Maximum fallback attempts before defaulting. Default: 2 */
  maxAttempts?: number;
  /** Default event type on timeout/max attempts. Default: eventMap.B */
  defaultEvent?: string;
  /** How long to record before auto-stopping (ms). Default: 6000 */
  listeningDurationMs?: number;
}

export interface VoiceChoiceResult {
  eventType: string;
  confidence: number;
  transcript: string;
  wasDefault: boolean;
}

export type VoiceLifecyclePhase = 'idle' | 'listening' | 'processing' | 'decided' | 'fallback';

export type VoiceLifecycle =
  | { phase: 'idle' }
  | { phase: 'listening'; startedAt: number; previousAttempt?: number }
  | { phase: 'processing'; blob: Blob; attempt: number }
  | { phase: 'decided'; result: VoiceChoiceResult; attempt: number }
  | { phase: 'fallback'; attempt: number };

export type VoiceEvent =
  | { type: 'START_LISTENING' }
  | { type: 'AUDIO_READY'; blob: Blob }
  | { type: 'CLASSIFICATION_COMPLETE'; result: VoiceChoiceResult }
  | { type: 'NEED_FALLBACK'; attempt: number }
  | { type: 'RESET' };

export interface UseVoiceChoiceReturn {
  // Backward compatible
  isListening: boolean;
  isProcessing: boolean;
  choiceResult: VoiceChoiceResult | null;
  needsFallback: boolean;
  attemptCount: number;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  reset: () => void;
  /** Pre-warm getUserMedia so recording starts instantly when activated */
  warmUp: () => void;
  // New: explicit lifecycle
  lifecycle: VoiceLifecycle;
  dispatch: React.Dispatch<VoiceEvent>;
}

const MAX_ATTEMPTS_DEFAULT = 2;
const CONFIDENCE_THRESHOLD_DEFAULT = 0.7;
const LISTENING_DURATION_DEFAULT = 6000;

const logger = createLogger('VoiceChoice');

/**
 * Voice lifecycle reducer - explicit finite state machine
 */
export function voiceLifecycleReducer(state: VoiceLifecycle, event: VoiceEvent): VoiceLifecycle {
  // RESET can happen from any non-idle state (e.g., deactivation during listening)
  if (event.type === 'RESET') {
    if (state.phase === 'idle') return state;
    return { phase: 'idle' };
  }

  switch (state.phase) {
    case 'idle':
      if (event.type === 'START_LISTENING') {
        return { phase: 'listening', startedAt: Date.now() };
      }
      return state;

    case 'listening':
      if (event.type === 'AUDIO_READY') {
        // Use previous attempt count + 1, or start at 1
        const attempt = (state.previousAttempt ?? 0) + 1;
        return { phase: 'processing', blob: event.blob, attempt };
      }
      return state;

    case 'processing':
      if (event.type === 'CLASSIFICATION_COMPLETE') {
        return { phase: 'decided', result: event.result, attempt: state.attempt };
      }
      if (event.type === 'NEED_FALLBACK') {
        return { phase: 'fallback', attempt: event.attempt };
      }
      return state;

    case 'fallback':
      if (event.type === 'START_LISTENING') {
        // Preserve the attempt count when retrying from fallback
        return { phase: 'listening', startedAt: Date.now(), previousAttempt: state.attempt };
      }
      return state;

    case 'decided':
      return state;

    default:
      return state;
  }
}

/**
 * Voice choice hook with lifecycle managed by `active` flag.
 * When active=true, starts recording → auto-stop → STT → NLU → choiceResult.
 * When active=false, stops everything and resets.
 */
export function useVoiceChoice(config: ChoiceConfig, active: boolean): UseVoiceChoiceReturn {
  const { isRecording, audioBlob, error: micError, startRecording, stopRecording, warmUp } = useMicrophone();

  const [lifecycle, dispatch] = useReducer(voiceLifecycleReducer, { phase: 'idle' });
  const [error, setError] = useReducer((_: string | null, newError: string | null) => newError, null);

  useDebugValue(
    active ? `${lifecycle.phase} (active)` : `${lifecycle.phase} (inactive)`
  );

  const sttRef = useRef<STTService | null>(null);
  const nluRef = useRef<NLUService | null>(null);

  // Freeze config in a ref while active — prevents stale closure in processAudio
  const configRef = useRef(config);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
    if (active) {
      configRef.current = config;
    }
  }, [config, active]);

  // Lazy-init services
  const getSTT = useCallback((): STTService => {
    if (!sttRef.current) {
      sttRef.current = createSTTService();
    }
    return sttRef.current;
  }, []);

  const getNLU = useCallback((): NLUService => {
    if (!nluRef.current) {
      nluRef.current = createNLUService();
    }
    return nluRef.current;
  }, []);

  const threshold = config.confidenceThreshold ?? CONFIDENCE_THRESHOLD_DEFAULT;
  const maxAttempts = config.maxAttempts ?? MAX_ATTEMPTS_DEFAULT;
  const defaultEvent = config.defaultEvent ?? config.eventMap.B;
  const listeningDuration = config.listeningDurationMs ?? LISTENING_DURATION_DEFAULT;

  const startListening = useCallback(async () => {
    setError(null);
    dispatch({ type: 'START_LISTENING' });
    logger.log('startListening START', { duration: listeningDuration, active });
    await startRecording(listeningDuration);
  }, [startRecording, listeningDuration, active]);

  const stopListening = useCallback(() => {
    logger.log('stopListening');
    stopRecording();
  }, [stopRecording]);

  const reset = useCallback(() => {
    logger.log('reset');
    dispatch({ type: 'RESET' });
    processingRef.current = false;
    setError(null);
  }, []);

  /**
   * Lifecycle: start recording when active, stop when inactive.
   * The auto-stop timer lives inside useMicrophone — immune to React re-renders.
   */
  const activationHandledRef = useRef(false);
  useEffect(() => {
    if (!active) {
      // Deactivating: stop recording and reset state
      stopRecording();
      if (lifecycle.phase !== 'idle') {
        dispatch({ type: 'RESET' });
      }
      activationHandledRef.current = false;
      return;
    }

    // Activating: start capture only once per activation
    if (!activationHandledRef.current) {
      activationHandledRef.current = true;
      const activationStart = performance.now();
      logger.log('Activation timing — starting capture', { activationStart });
      startListening()
        .then(() => {
          const elapsed = performance.now() - activationStart;
          logger.log('Activation timing — recording started', { elapsedMs: elapsed.toFixed(2) });
        })
        .catch((err) => {
          const elapsed = performance.now() - activationStart;
          logger.error('Activation timing — failed to start', { elapsedMs: elapsed.toFixed(2), error: err });
        });
    }

    return () => {
      logger.log('Cleanup — stopping recording');
      stopRecording();
      // Reset so StrictMode re-invocation (or re-activation) restarts recording
      activationHandledRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Dispatch AUDIO_READY when audioBlob arrives during listening phase
  useEffect(() => {
    if (!audioBlob || lifecycle.phase !== 'listening') return;

    dispatch({ type: 'AUDIO_READY', blob: audioBlob });
  }, [audioBlob, lifecycle.phase]);

  // Guard against React Strict Mode double-invocation of processing effect
  const processingRef = useRef(false);

  // Process audio when in processing phase
  useEffect(() => {
    if (lifecycle.phase !== 'processing') return;

    // Strict Mode guard: prevent duplicate API calls
    if (processingRef.current) {
      logger.log('Processing already in flight — skipping duplicate');
      return;
    }
    processingRef.current = true;

    const { blob, attempt: currentAttempt } = lifecycle;

    // Snapshot config from ref (frozen while active)
    const snap = configRef.current;

    // Guard: don't process with invalid/dummy config
    if (!snap.options.A || !snap.options.B) {
      logger.log('Ignoring audioBlob — config has empty options');
      processingRef.current = false;
      return;
    }

    let cancelled = false;

    async function processAudio() {
      logger.log('Processing audio blob START', { size: blob.size, attempt: currentAttempt });

      try {
        // Step 1: Transcribe (with keyword hint to reduce Whisper hallucinations)
        const stt = getSTT();
        const allKeywords = [
          snap.options.A,
          snap.options.B,
          ...(snap.keywords?.A || []),
          ...(snap.keywords?.B || []),
        ];
        const promptHint = allKeywords.join(', ');
        const transcript = await stt.transcribe(blob, promptHint);

        if (cancelled) return;

        logger.log('STT complete', { transcript: JSON.stringify(transcript), length: transcript?.length });

        if (!transcript || transcript.trim() === '') {
          // Empty transcript -- treat as silence
          if (currentAttempt >= maxAttempts) {
            logger.log('Max attempts reached, using default', { attempt: currentAttempt });
            dispatch({
              type: 'CLASSIFICATION_COMPLETE',
              result: {
                eventType: defaultEvent,
                confidence: 0,
                transcript: '',
                wasDefault: true,
              },
            });
          } else {
            logger.log('Empty transcript, requesting fallback', { attempt: currentAttempt });
            dispatch({ type: 'NEED_FALLBACK', attempt: currentAttempt });
          }
          return;
        }

        // Step 2: Classify (using frozen config snapshot)
        const nlu = getNLU();
        const classification: ClassificationResult = await nlu.classify(
          transcript,
          snap.questionContext,
          snap.options,
          snap.keywords
        );

        if (cancelled) return;

        logger.log('NLU complete', { choice: classification.choice, confidence: classification.confidence });

        // Step 3: Check confidence
        if (classification.confidence >= threshold) {
          const eventType = classification.choice === 'A'
            ? snap.eventMap.A
            : snap.eventMap.B;

          logger.log('Choice accepted', { eventType, confidence: classification.confidence });
          dispatch({
            type: 'CLASSIFICATION_COMPLETE',
            result: {
              eventType,
              confidence: classification.confidence,
              transcript,
              wasDefault: false,
            },
          });
        } else if (currentAttempt >= maxAttempts) {
          // Max attempts reached -- use default
          logger.log('Max attempts reached, using default', { attempt: currentAttempt });
          dispatch({
            type: 'CLASSIFICATION_COMPLETE',
            result: {
              eventType: defaultEvent,
              confidence: classification.confidence,
              transcript,
              wasDefault: true,
            },
          });
        } else {
          // Low confidence, can retry
          logger.log('Low confidence, requesting fallback', { confidence: classification.confidence, attempt: currentAttempt });
          dispatch({ type: 'NEED_FALLBACK', attempt: currentAttempt });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Voice processing failed';
          logger.error('Processing error:', message);
          setError(message);

          // On error after max attempts, default
          if (currentAttempt >= maxAttempts) {
            dispatch({
              type: 'CLASSIFICATION_COMPLETE',
              result: {
                eventType: defaultEvent,
                confidence: 0,
                transcript: '',
                wasDefault: true,
              },
            });
          } else {
            dispatch({ type: 'NEED_FALLBACK', attempt: currentAttempt });
          }
        }
      }
    }

    processAudio().finally(() => {
      processingRef.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [lifecycle, getSTT, getNLU, threshold, maxAttempts, defaultEvent]);

  // Derive backward-compatible return values from lifecycle
  const isListening = isRecording;
  const isProcessing = lifecycle.phase === 'processing';
  const needsFallback = lifecycle.phase === 'fallback';
  const choiceResult = lifecycle.phase === 'decided' ? lifecycle.result : null;
  const attemptCount =
    lifecycle.phase === 'processing' ? lifecycle.attempt :
    lifecycle.phase === 'fallback' ? lifecycle.attempt :
    lifecycle.phase === 'decided' ? lifecycle.attempt :
    0;

  return {
    isListening,
    isProcessing,
    choiceResult,
    needsFallback,
    attemptCount,
    error: error || micError,
    startListening,
    stopListening,
    reset,
    warmUp,
    lifecycle,
    dispatch,
  };
}
