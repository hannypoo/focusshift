import { useState, useRef, useCallback, useEffect } from 'react';

// Browser Speech Recognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const WAKE_WORDS = ['nudgley', 'nudge lee', 'nudge me', 'hey nudgley', 'hey nudge lee'];

/**
 * Extracts the command after a wake word.
 * "Hey Nudgley I need groceries" → "I need groceries"
 * "Nudgley" alone → null (means: wake word detected, waiting for command)
 */
function extractCommandAfterWakeWord(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const wake of WAKE_WORDS) {
    const idx = lower.indexOf(wake);
    if (idx !== -1) {
      const after = text.substring(idx + wake.length).trim();
      // Strip leading punctuation/filler
      const cleaned = after.replace(/^[,.\s]+/, '').trim();
      return cleaned || null;
    }
  }
  return undefined as unknown as null; // no wake word found
}

function containsWakeWord(text: string): boolean {
  const lower = text.toLowerCase();
  return WAKE_WORDS.some((w) => lower.includes(w));
}

/**
 * Speech recognition hook with two modes:
 * 1. Manual: user taps mic → speaks → auto-sends
 * 2. Wake word: always listening for "Nudgley" → captures command → auto-sends
 */
export function useSpeechRecognition(onResult: (transcript: string) => void) {
  const [listening, setListening] = useState(false);         // actively capturing a command
  const [wakeListening, setWakeListening] = useState(false); // background wake word listening
  const [interim, setInterim] = useState('');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wakeRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  // Track if we should keep restarting wake listener
  const wakeEnabledRef = useRef(false);

  const supported = !!getSpeechRecognition();

  // ── Manual mic button ──────────────────────────────────────────
  const startManual = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    // Pause wake listener while manual is active
    if (wakeRecognitionRef.current) {
      wakeRecognitionRef.current.abort();
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListening(true);
      setInterim('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setInterim('');
        onResultRef.current(finalTranscript.trim());
      } else {
        setInterim(interimTranscript);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setInterim('');
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
      // Restart wake listener if it was enabled
      if (wakeEnabledRef.current) {
        startWakeListener();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopManual = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const toggleManual = useCallback(() => {
    if (listening) {
      stopManual();
    } else {
      startManual();
    }
  }, [listening, startManual, stopManual]);

  // ── Wake word listener (continuous background) ─────────────────
  const startWakeListener = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR || !wakeEnabledRef.current) return;

    // Don't start if manual is active
    if (recognitionRef.current) return;

    if (wakeRecognitionRef.current) {
      wakeRecognitionRef.current.abort();
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let wakeDetected = false;
    let commandBuffer = '';

    recognition.onstart = () => {
      setWakeListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Collect all text from current results
      let fullTranscript = '';
      let latestInterim = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          fullTranscript += result[0].transcript;
        } else {
          latestInterim += result[0].transcript;
        }
      }

      const allText = fullTranscript + ' ' + latestInterim;

      if (!wakeDetected) {
        // Check for wake word in any text
        if (containsWakeWord(allText)) {
          wakeDetected = true;

          // Check if command was said in same breath: "Nudgley I need groceries"
          const command = extractCommandAfterWakeWord(allText);
          if (command) {
            // Full command in one utterance — send it
            commandBuffer = command;
            recognition.stop();
            return;
          }

          // Just the wake word — show we're listening for the command
          setListening(true);
          setInterim('');
        }
      } else {
        // Wake word already detected — capture the command
        if (fullTranscript) {
          // Remove wake word from the final transcript if present
          let cmd = fullTranscript.trim();
          for (const wake of WAKE_WORDS) {
            const idx = cmd.toLowerCase().indexOf(wake);
            if (idx !== -1) {
              cmd = cmd.substring(idx + wake.length).trim().replace(/^[,.\s]+/, '');
            }
          }
          if (cmd) {
            commandBuffer = cmd;
            recognition.stop();
            return;
          }
        }

        // Show interim while waiting for command
        let interimCmd = latestInterim.trim();
        for (const wake of WAKE_WORDS) {
          const idx = interimCmd.toLowerCase().indexOf(wake);
          if (idx !== -1) {
            interimCmd = interimCmd.substring(idx + wake.length).trim().replace(/^[,.\s]+/, '');
          }
        }
        setInterim(interimCmd);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.debug('Wake listener error:', event.error);
      }
      setWakeListening(false);
      wakeDetected = false;
      setListening(false);
      setInterim('');

      // Auto-restart after errors (Chrome kills recognition after silence)
      if (wakeEnabledRef.current) {
        setTimeout(() => startWakeListener(), 300);
      }
    };

    recognition.onend = () => {
      setWakeListening(false);
      setListening(false);
      setInterim('');

      // If we captured a command, send it
      if (commandBuffer) {
        onResultRef.current(commandBuffer);
        commandBuffer = '';
        wakeDetected = false;
      }

      // Auto-restart to keep listening for wake word
      if (wakeEnabledRef.current) {
        setTimeout(() => startWakeListener(), 300);
      }
    };

    wakeRecognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // Already started or other error — retry after delay
      setTimeout(() => {
        if (wakeEnabledRef.current) startWakeListener();
      }, 1000);
    }
  }, []);

  // ── Toggle wake word mode ──────────────────────────────────────
  const toggleWakeWord = useCallback(() => {
    if (wakeEnabledRef.current) {
      // Disable
      wakeEnabledRef.current = false;
      setWakeWordEnabled(false);
      if (wakeRecognitionRef.current) {
        wakeRecognitionRef.current.abort();
        wakeRecognitionRef.current = null;
      }
      setWakeListening(false);
    } else {
      // Enable
      wakeEnabledRef.current = true;
      setWakeWordEnabled(true);
      startWakeListener();
    }
  }, [startWakeListener]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wakeEnabledRef.current = false;
      if (recognitionRef.current) recognitionRef.current.abort();
      if (wakeRecognitionRef.current) wakeRecognitionRef.current.abort();
    };
  }, []);

  return {
    listening,           // actively capturing a command (manual or wake-word triggered)
    wakeListening,       // background wake word listener is running
    wakeWordEnabled,     // user has toggled wake word mode on
    interim,             // live transcript preview
    supported,           // browser supports speech recognition
    toggle: toggleManual,
    toggleWakeWord,
  };
}
