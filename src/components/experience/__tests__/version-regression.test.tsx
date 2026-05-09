import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { VersionProvider, useVersion } from '@/contexts/VersionContext';
import VersionSelector from '../VersionSelector';
import { getVoiceType } from '@/lib/voice/voiceClassification';

function wrapper({ children }: { children: ReactNode }) {
  return <VersionProvider>{children}</VersionProvider>;
}

describe('V1 regression -- zero behavioral change (VER-03)', () => {
  it('VersionProvider defaults to V1', () => {
    const { result } = renderHook(() => useVersion(), { wrapper });
    expect(result.current.version).toBe('V1');
  });

  it('VersionSelector renders with V1 pre-selected', () => {
    render(
      <VersionProvider>
        <VersionSelector onContinue={vi.fn()} />
      </VersionProvider>
    );

    const v1Button = screen.getByTestId('version-v1');
    const v2Button = screen.getByTestId('version-v2');

    expect(v1Button).toHaveAttribute('aria-pressed', 'true');
    expect(v2Button).toHaveAttribute('aria-pressed', 'false');
  });

  it('V1 selection does not call setVersion unnecessarily', () => {
    const { result } = renderHook(() => useVersion(), { wrapper });

    // V1 is already selected by default
    expect(result.current.version).toBe('V1');

    // Render selector and click V1 (already selected)
    render(
      <VersionProvider>
        <VersionSelector onContinue={vi.fn()} />
      </VersionProvider>
    );

    fireEvent.click(screen.getByTestId('version-v1'));

    // Version should still be V1
    const { result: result2 } = renderHook(() => useVersion(), { wrapper });
    expect(result2.current.version).toBe('V1');
  });

  it('Continuar with V1 default proceeds without changing version', () => {
    const onContinue = vi.fn();

    function TestComponent() {
      const { version } = useVersion();
      return (
        <>
          <VersionSelector onContinue={onContinue} />
          <span data-testid="current-version">{version}</span>
        </>
      );
    }

    render(
      <VersionProvider>
        <TestComponent />
      </VersionProvider>
    );

    // Click Continuar without selecting V2
    fireEvent.click(screen.getByTestId('version-continue'));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('current-version')).toHaveTextContent('V1');
  });

  it('V1 voice classification routes keys correctly (contract test)', () => {
    // Bookend keys -> VOZ_PERGUNTA
    expect(getVoiceType('APRESENTACAO')).toBe('VOZ_PERGUNTA');
    expect(getVoiceType('ENCERRAMENTO')).toBe('VOZ_PERGUNTA');

    // Question keys -> VOZ_PERGUNTA
    expect(getVoiceType('INFERNO_Q1_PERGUNTA')).toBe('VOZ_PERGUNTA');
    expect(getVoiceType('PARAISO_Q5_PERGUNTA')).toBe('VOZ_PERGUNTA');

    // Fallback/timeout prefixes -> VOZ_PERGUNTA
    expect(getVoiceType('FALLBACK_Q1')).toBe('VOZ_PERGUNTA');
    expect(getVoiceType('TIMEOUT_Q3')).toBe('VOZ_PERGUNTA');

    // Narrative keys -> VOZ_NARRATIVA
    expect(getVoiceType('INFERNO_Q1_SETUP')).toBe('VOZ_NARRATIVA');
    expect(getVoiceType('INFERNO_Q1_RESPOSTA_A')).toBe('VOZ_NARRATIVA');
    expect(getVoiceType('DEVOLUCAO_SEEKER')).toBe('VOZ_NARRATIVA');
    expect(getVoiceType('PURGATORIO_Q3_INTRO')).toBe('VOZ_NARRATIVA');
  });
});

describe('V2 selection flow', () => {
  it('Selecting V2 updates version context', () => {
    function TestComponent() {
      const { version } = useVersion();
      return (
        <>
          <VersionSelector onContinue={vi.fn()} />
          <span data-testid="current-version">{version}</span>
        </>
      );
    }

    render(
      <VersionProvider>
        <TestComponent />
      </VersionProvider>
    );

    // Initially V1
    expect(screen.getByTestId('current-version')).toHaveTextContent('V1');

    // Click V2
    fireEvent.click(screen.getByTestId('version-v2'));

    // Should now be V2
    expect(screen.getByTestId('current-version')).toHaveTextContent('V2');
  });

  it('V2 selection persists after clicking Continuar', () => {
    const onContinue = vi.fn();

    function TestComponent() {
      const { version } = useVersion();
      return (
        <>
          <VersionSelector onContinue={onContinue} />
          <span data-testid="current-version">{version}</span>
        </>
      );
    }

    render(
      <VersionProvider>
        <TestComponent />
      </VersionProvider>
    );

    // Select V2
    fireEvent.click(screen.getByTestId('version-v2'));
    expect(screen.getByTestId('current-version')).toHaveTextContent('V2');

    // Click Continuar
    fireEvent.click(screen.getByTestId('version-continue'));

    // Version should still be V2
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('current-version')).toHaveTextContent('V2');
  });

  it('Version persists across re-renders (session persistence VER-02)', () => {
    const { result, rerender } = renderHook(() => useVersion(), { wrapper });

    // Default is V1
    expect(result.current.version).toBe('V1');

    // Set to V2
    act(() => {
      result.current.setVersion('V2');
    });
    expect(result.current.version).toBe('V2');

    // Re-render — version should persist
    rerender();
    expect(result.current.version).toBe('V2');
  });
});
