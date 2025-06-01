
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSTTReturn {
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

export function useSTT(): UseSTTReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setInterimTranscript(interim);
          if (final) {
            setFinalTranscript(prev => prev + final);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setError(event.error === 'no-speech' ? 'No speech detected.' :
                   event.error === 'audio-capture' ? 'Microphone problem.' :
                   event.error === 'not-allowed' ? 'Permission denied.' :
                   'Speech recognition error.');
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      } else {
        setIsSupported(false);
        setError("Speech recognition not supported in this browser.");
      }
    }
    return () => {
      recognitionRef.current?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setFinalTranscript(''); 
      setInterimTranscript('');
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
        setError("Could not start speech recognition.");
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, interimTranscript, finalTranscript, startListening, stopListening, error, isSupported };
}
