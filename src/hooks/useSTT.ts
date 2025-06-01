
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
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognitionAPI();
        const recognition = recognitionRef.current;
        recognition.continuous = true; 
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
            setFinalTranscript(newFinalSegment.trim()); 
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
              // Only set error if aborted unexpectedly.
              // If stopListening was called, isListening would be false.
              if (isListening) { 
                userFriendlyError = 'Speech recognition was aborted. If this was unintentional, please try again.';
              } else {
                return; 
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

    const currentRecognition = recognitionRef.current;
    return () => {
        if (currentRecognition) {
            currentRecognition.onresult = null;
            currentRecognition.onerror = null;
            currentRecognition.onend = null;
            try {
                // Abort any ongoing recognition if the component unmounts
                currentRecognition.abort();
            } catch (e) {
                // console.warn("Error aborting speech recognition on unmount:", e);
            }
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // isListening removed as it's managed internally or by callbacks

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
        if (e instanceof DOMException && e.name === 'NotAllowedError') {
             setError('Permission to use the microphone was denied. Please enable microphone access in your browser settings.');
        } else if (e instanceof DOMException && e.name === 'InvalidStateError') {
            console.warn("Speech recognition service was in an invalid state.");
            setError("Speech recognition service issue. Please try again shortly.");
        } else {
            setError("Could not start speech recognition. Please ensure your microphone is working and permissions are granted.");
        }
        setIsListening(false);
      }
    }
  }, [isListening]); 

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // isListening will be set to false by the 'onend' or 'onerror' event
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
