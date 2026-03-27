import { useState, useEffect, useRef, useCallback } from "react";

// Type augmentation for Web Speech API
interface SpeechRecognitionAPI extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionAPI;
    webkitSpeechRecognition: new () => SpeechRecognitionAPI;
  }
}

export interface VoiceCommand {
  command: string;
  timestamp: number;
}

interface UseVoiceControlOptions {
  onCommand: (command: string) => void;
  enabled?: boolean;
}

const SUPPORTED_COMMANDS = [
  "play", "pause", "stop", "resume",
  "next", "next lesson", "previous", "previous lesson", "go back",
  "mute", "unmute", "volume up", "volume down",
  "skip forward", "skip backward", "rewind",
  "open quiz", "start quiz", "submit", "submit quiz",
  "option a", "option b", "option c", "option d",
  "select a", "select b", "select c", "select d",
  "open chat", "close chat",
  "read lesson", "read title",
  "help", "commands",
  "fullscreen", "exit fullscreen",
];

export function useVoiceControl({ onCommand, enabled = false }: UseVoiceControlOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionAPI | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const matchCommand = useCallback((text: string): string | null => {
    const lower = text.toLowerCase().trim();
    // Direct match
    const direct = SUPPORTED_COMMANDS.find((c) => lower.includes(c));
    if (direct) return direct;
    // Fuzzy aliases
    if (lower.includes("forward")) return "skip forward";
    if (lower.includes("backward") || lower.includes("back") && !lower.includes("go back")) return "skip backward";
    if (lower.includes("go back")) return "go back";
    if (lower.includes("louder")) return "volume up";
    if (lower.includes("quieter") || lower.includes("softer")) return "volume down";
    if (lower.includes("begin quiz") || lower.includes("take quiz")) return "open quiz";
    if (lower.includes("answer a") || lower.includes("choose a") || lower.includes("first option")) return "option a";
    if (lower.includes("answer b") || lower.includes("choose b") || lower.includes("second option")) return "option b";
    if (lower.includes("answer c") || lower.includes("choose c") || lower.includes("third option")) return "option c";
    if (lower.includes("answer d") || lower.includes("choose d") || lower.includes("fourth option")) return "option d";
    return null;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(interimTranscript || finalTranscript);

      if (finalTranscript) {
        const matched = matchCommand(finalTranscript);
        if (matched) {
          setCommandHistory((prev) => [
            { command: matched, timestamp: Date.now() },
            ...prev.slice(0, 9),
          ]);
          onCommand(matched);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setIsListening(false);
        return;
      }
      // Auto-restart on transient errors
      if (event.error !== "aborted") {
        restartTimeoutRef.current = setTimeout(() => {
          if (isListening) startListening();
        }, 1000);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListening) {
        restartTimeoutRef.current = setTimeout(() => {
          startListening();
        }, 500);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isSupported, isListening, matchCommand, onCommand]);

  const stopListening = useCallback(() => {
    clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Stop listening when disabled
  useEffect(() => {
    if (!enabled && isListening) {
      stopListening();
    }
  }, [enabled, isListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    commandHistory,
    toggleListening,
    startListening,
    stopListening,
    supportedCommands: SUPPORTED_COMMANDS,
  };
}
