import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { SpeechSegment } from '@/types';

// Mock modules before imports
const mockGetAudioContext = vi.fn();
const mockInitAudioContext = vi.fn();
const mockGetEffectsInput = vi.fn();
const mockFallbackSpeak = vi.fn();
const mockFallbackCancel = vi.fn();

vi.mock('@/lib/audio/audioContext', () => ({
  getAudioContext: mockGetAudioContext,
  initAudioContext: mockInitAudioContext,
  getEffectsInput: mockGetEffectsInput,
}));

vi.mock('../fallback', () => {
  return {
    FallbackTTSService: class MockFallbackTTSService {
      speak = mockFallbackSpeak.mockResolvedValue(undefined);
      cancel = mockFallbackCancel;
    },
  };
});

// Import after mocks are set up
const { ElevenLabsTTSService } = await import('../elevenlabs');
const { FallbackTTSService } = await import('../fallback');
const { PHASE_VOICE_SETTINGS } = await import('../index');

// Import types separately to avoid TS2749 error
import type { VoiceSettings } from '../index';
import type { ElevenLabsTTSService as ElevenLabsTTSServiceType } from '../elevenlabs';

describe('ElevenLabsTTSService', () => {
  let service: ElevenLabsTTSServiceType;
  let mockAudioContext: any;
  let mockFetch: any;

  beforeEach(() => {
    // Mock AudioContext
    mockAudioContext = {
      createBufferSource: vi.fn(() => ({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      })),
      decodeAudioData: vi.fn(() =>
        Promise.resolve({
          duration: 1.0,
          length: 44100,
          numberOfChannels: 2,
          sampleRate: 44100,
        })
      ),
      destination: {},
    };

    // Set up mock returns
    mockGetAudioContext.mockReturnValue(mockAudioContext);
    mockInitAudioContext.mockResolvedValue(mockAudioContext);
    // Effects input not initialized in test — falls back to destination
    mockGetEffectsInput.mockReturnValue(null);

    // Create a mock blob with arrayBuffer method
    const createMockBlob = () => {
      const blob = new Blob(['audio'], { type: 'audio/mpeg' });
      // Add arrayBuffer method
      (blob as any).arrayBuffer = vi.fn(() => Promise.resolve(new ArrayBuffer(8)));
      return blob;
    };

    // Mock global fetch
    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(createMockBlob()),
      })
    );
    global.fetch = mockFetch as any;

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Clear all mocks including fallback
    vi.clearAllMocks();
    mockFallbackSpeak.mockClear();
    mockFallbackCancel.mockClear();

    service = new ElevenLabsTTSService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should implement TTSService interface with speak and cancel methods', () => {
    expect(service).toBeDefined();
    expect(typeof service.speak).toBe('function');
    expect(typeof service.cancel).toBe('function');
  });

  it('should call fetch with POST to /api/tts with correct headers and body structure', async () => {
    const segments: SpeechSegment[] = [
      { text: 'First segment', pauseAfter: 1000 },
      { text: 'Second segment', pauseAfter: 500 },
    ];
    const voiceSettings: VoiceSettings = {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.3,
      speed: 0.9,
      phase: 'APRESENTACAO',
    };

    const speakPromise = service.speak(segments, voiceSettings);

    // Simulate playback completion
    setTimeout(() => {
      const mockSource = mockAudioContext.createBufferSource.mock.results[0]?.value;
      if (mockSource?.onended) {
        mockSource.onended();
      }
    }, 10);

    await speakPromise;

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/tts',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    );

    // Verify body content
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.text).toBe('First segment Second segment');
    expect(body.voice_settings).toEqual({
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.3,
      speed: 0.9,
    });
  });

  it('should forward all voice_settings parameters from PHASE_VOICE_SETTINGS (RTTS-02)', async () => {
    const segments: SpeechSegment[] = [{ text: 'Test text' }];
    const voiceSettings = PHASE_VOICE_SETTINGS.INFERNO;

    const speakPromise = service.speak(segments, voiceSettings);

    // Simulate playback completion
    setTimeout(() => {
      const mockSource = mockAudioContext.createBufferSource.mock.results[0]?.value;
      if (mockSource?.onended) {
        mockSource.onended();
      }
    }, 10);

    await speakPromise;

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.voice_settings).toEqual({
      stability: 0.7,
      similarity_boost: 0.9,
      style: 0.5,
      speed: 0.8,
    });
  });

  it('should convert blob to ArrayBuffer, decode audio, and play via Web Audio API', async () => {
    const segments: SpeechSegment[] = [{ text: 'Test audio playback' }];
    const voiceSettings = PHASE_VOICE_SETTINGS.APRESENTACAO;

    const speakPromise = service.speak(segments, voiceSettings);

    // Simulate playback completion
    setTimeout(() => {
      const mockSource = mockAudioContext.createBufferSource.mock.results[0]?.value;
      if (mockSource?.onended) {
        mockSource.onended();
      }
    }, 10);

    await speakPromise;

    expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();

    const mockSource = mockAudioContext.createBufferSource.mock.results[0].value;
    expect(mockSource.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    expect(mockSource.start).toHaveBeenCalled();
  });

  it('should call URL.revokeObjectURL after playback completes', async () => {
    const segments: SpeechSegment[] = [{ text: 'Test cleanup' }];
    const voiceSettings = PHASE_VOICE_SETTINGS.APRESENTACAO;

    const speakPromise = service.speak(segments, voiceSettings);

    // Simulate playback completion
    setTimeout(() => {
      const mockSource = mockAudioContext.createBufferSource.mock.results[0]?.value;
      if (mockSource?.onended) {
        mockSource.onended();
      }
    }, 10);

    await speakPromise;

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should fall back to FallbackTTSService when fetch returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
    });

    const segments: SpeechSegment[] = [{ text: 'Test fallback' }];
    const voiceSettings = PHASE_VOICE_SETTINGS.APRESENTACAO;

    await service.speak(segments, voiceSettings);

    // Verify fallback speak method was called with correct args
    expect(mockFallbackSpeak).toHaveBeenCalledWith(segments, voiceSettings, undefined, undefined, undefined);
  });

  it('should fall back to FallbackTTSService when fetch throws network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const segments: SpeechSegment[] = [{ text: 'Test network error' }];
    const voiceSettings = PHASE_VOICE_SETTINGS.APRESENTACAO;

    await service.speak(segments, voiceSettings);

    // Verify FallbackTTSService was called
    expect(mockFallbackSpeak).toHaveBeenCalledWith(segments, voiceSettings, undefined, undefined, undefined);
  });

  it('should stop currentSource when cancel() is called', async () => {
    const segments: SpeechSegment[] = [{ text: 'Test cancel' }];
    const voiceSettings = PHASE_VOICE_SETTINGS.APRESENTACAO;

    const speakPromise = service.speak(segments, voiceSettings);

    // Wait for audio source to be created and cancel
    setTimeout(() => {
      service.cancel();
      // Trigger onended after cancellation
      const mockSource = mockAudioContext.createBufferSource.mock.results[0]?.value;
      if (mockSource?.onended) {
        mockSource.onended();
      }
    }, 20);

    await expect(speakPromise).rejects.toThrow('Speech cancelled');

    // Check that stop was called on the source
    const mockSource = mockAudioContext.createBufferSource.mock.results[0]?.value;
    expect(mockSource?.stop).toHaveBeenCalled();
  });

  it('should reject with "Speech cancelled" when cancel() called during playback', async () => {
    const segments: SpeechSegment[] = [{ text: 'Test cancel during playback' }];
    const voiceSettings = PHASE_VOICE_SETTINGS.APRESENTACAO;

    const speakPromise = service.speak(segments, voiceSettings);

    // Cancel after a short delay
    setTimeout(() => {
      service.cancel();
      const mockSource = mockAudioContext.createBufferSource.mock.results[0]?.value;
      if (mockSource?.onended) {
        mockSource.onended();
      }
    }, 10);

    await expect(speakPromise).rejects.toThrow('Speech cancelled');
  });
});
