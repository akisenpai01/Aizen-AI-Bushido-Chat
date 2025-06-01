
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSTTReturn {
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string; // This will now represent the LATEST finalized segment
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

export function useSTT(): UseSTTReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState(''); // Represents the latest finalized segment
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
        recognition.continuous = true; // Keep continuous for longer dictation
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let currentInterim = '';
          let newFinalSegment = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinalSegment += transcript;
            } else {
              currentInterim += transcript;
            }
          }
          setInterimTranscript(currentInterim);
          if (newFinalSegment) {
            setFinalTranscript(newFinalSegment.trim()); // Set the new final segment
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error details:', event.error);
          let userFriendlyError = 'An unexpected speech recognition error occurred. Please try again.';
          switch (event.error as SpeechRecognitionErrorCode) {
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
              // Don't set error for manual aborts if stopListening was called
              if (isListening) { // Check if it was aborted while we thought we were listening
                userFriendlyError = 'Speech recognition was aborted. If this was unintentional, please try again.';
              } else {
                return; // Likely aborted by stopListening call, so no error needed.
              }
              break;
            case 'bad-grammar':
              userFriendlyError = 'Speech recognition had trouble understanding the audio. Please try speaking clearly.';
              break;
            case 'language-not-supported':
              userFriendlyError = 'The configured language for speech recognition is not supported by your browser.';
              break;
          }
          setError(userFriendlyError);
          setIsListening(false); // Ensure listening is set to false on error
        };

        recognition.onend = () => {
          setIsListening(false); // Ensure isListening is false when recognition ends
        };
      } else {
        setIsSupported(false);
        setError("Speech recognition not supported in this browser.");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // isListening removed from deps to avoid re-creating recognition on its change

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setFinalTranscript(''); // Clear previous final segment
      setInterimTranscript('');
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
        if (e instanceof DOMException && e.name === 'NotAllowedError') {
             setError('Permission to use the microphone was denied. Please enable microphone access in your browser settings.');
        } else if (e instanceof DOMException && e.name === 'InvalidStateError') {
            // This can happen if start() is called while already started, though our isListening check should prevent it.
            // Or if it's in an error state.
            console.warn("Speech recognition service was in an invalid state. Attempting to reset.");
             try {
                recognitionRef.current.abort(); // Try to abort first
             } catch (abortError) {
                // Ignore abort error if it also fails
             }
             // Re-attempt start after a brief delay, or instruct user to retry
             setError("Speech recognition service issue. Please try again shortly.");

        } else {
            setError("Could not start speech recognition. Please ensure your microphone is working and permissions are granted.");
        }
        setIsListening(false);
      }
    }
  }, [isListening]); // isListening dependency is fine here

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false); // Explicitly set here, onend will also fire
    }
  }, [isListening]);

  return { isListening, interimTranscript, finalTranscript, startListening, stopListening, error, isSupported };
}

type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-available"
  | "bad-grammar"
  | "language-not-supported";
