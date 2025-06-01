
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '@/lib/localStorage';
import type { TTSSettings } from '@/types';

const TTS_SETTINGS_KEY = 'aizen_tts_settings';

interface UseTTSReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  ttsEnabled: boolean;
  speak: (text: string) => void;
  cancel: () => void;
  setSelectedVoiceURI: (uri: string | null) => void;
  setTtsEnabled: (enabled: boolean) => void;
  error: string | null;
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceState] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabledState] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      const settings = getItem<TTSSettings>(TTS_SETTINGS_KEY, { enabled: false, voiceURI: null });
      setTtsEnabledState(settings.enabled);
      setSelectedVoiceState(settings.voiceURI);

      const populateVoiceList = () => {
        const newVoices = speechSynthesis.getVoices();
        setVoices(newVoices);
        // If a preferred voice is saved and exists, ensure it's set
        if (settings.voiceURI && newVoices.some(v => v.voiceURI === settings.voiceURI)) {
          setSelectedVoiceState(settings.voiceURI);
        } else if (newVoices.length > 0) {
          // Default to the first available voice if no preference or preference invalid
          const defaultVoice = newVoices.find(v => v.lang.startsWith('en')) || newVoices[0];
          if (defaultVoice && !settings.voiceURI) {
             setSelectedVoiceState(defaultVoice.voiceURI);
          }
        }
      };

      populateVoiceList();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
      }
    } else {
      setIsSupported(false);
      setError("Text-to-Speech not supported in this browser.");
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    const currentSettings = getItem<TTSSettings>(TTS_SETTINGS_KEY, { enabled: false, voiceURI: null });
    setItem<TTSSettings>(TTS_SETTINGS_KEY, { ...currentSettings, ...newSettings });
  }, []);

  const setTtsEnabled = useCallback((enabled: boolean) => {
    setTtsEnabledState(enabled);
    updateSettings({ enabled });
  }, [updateSettings]);

  const setSelectedVoiceURI = useCallback((uri: string | null) => {
    setSelectedVoiceState(uri);
    updateSettings({ voiceURI: uri });
  }, [updateSettings]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !ttsEnabled || !text) return;

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); // Cancel current speech before starting new one
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoiceURI) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error', event.error);
      setError('Error speaking text.');
      setIsSpeaking(false);
    };
    speechSynthesis.speak(utterance);
  }, [isSupported, ttsEnabled, selectedVoiceURI, voices]);

  const cancel = useCallback(() => {
    if (isSupported && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    voices,
    selectedVoiceURI,
    ttsEnabled,
    speak,
    cancel,
    setSelectedVoiceURI,
    setTtsEnabled,
    error,
  };
}
