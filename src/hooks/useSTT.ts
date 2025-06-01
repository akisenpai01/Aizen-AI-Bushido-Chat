
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
          console.error('Speech recognition error details:', event.error); 
          let userFriendlyError = 'An unexpected speech recognition error occurred. Please try again.';
          switch (event.error as SpeechRecognitionErrorCode) { // Cast to SpeechRecognitionErrorCode for type safety
            case 'no-speech':
              userFriendlyError = 'No speech detected. Please ensure your microphone is active and try speaking clearly.';
              break;
            case 'audio-capture':
              userFriendlyError = 'Microphone problem. Please check your microphone connection and permissions.';
              break;
            case 'not-allowed':
              userFriendlyError = 'Permission to use the microphone was denied or has not been granted. Please enable microphone access in your browser settings for this site.';
              break;
            case 'network':
              userFriendlyError = 'A network error occurred during speech recognition. Please check your internet connection and try again.';
              break;
            case 'service-not-available':
              userFriendlyError = 'The speech recognition service is temporarily unavailable. Please try again later.';
              break;
            case 'aborted':
              userFriendlyError = 'Speech recognition was aborted. If this was unintentional, please try again.';
              break;
            case 'bad-grammar':
              userFriendlyError = 'Speech recognition had trouble understanding the audio. Please try speaking clearly.';
              break;
            case 'language-not-supported':
              userFriendlyError = 'The configured language for speech recognition is not supported by your browser.';
              break;
          }
          setError(userFriendlyError);
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

// Define SpeechRecognitionErrorCode type based on MDN documentation for completeness
type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-available"
  | "bad-grammar"
  | "language-not-supported";
