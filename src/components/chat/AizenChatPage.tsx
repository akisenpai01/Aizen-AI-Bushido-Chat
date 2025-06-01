
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import UserPreferencesQuizModal from '@/components/chat/UserPreferencesQuizModal';
import HaikuModal from '@/components/chat/HaikuModal';
import { useToast } from "@/hooks/use-toast";
import { useSTT } from '@/hooks/useSTT';
import { useTTS } from '@/hooks/useTTS';
import { getItem, setItem, removeItem } from '@/lib/localStorage';
import type { ChatMessage as ChatMessageType, UserPreferences, TTSSettings } from '@/types';
import { handleChatMessageAction, handleGenerateHaikuAction, handleFormatErrorAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const CHAT_HISTORY_KEY = 'aizen_chat_history';
const USER_PREFERENCES_KEY = 'aizen_user_preferences';
const QUIZ_COMPLETED_KEY = 'aizen_quiz_completed';

export default function AizenChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isHaikuModalOpen, setIsHaikuModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const [sttBaseText, setSttBaseText] = useState(''); // To store text before STT starts

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { 
    isListening: isSttListening, 
    interimTranscript, 
    finalTranscript: finalTranscriptSegment,
    startListening: sttStartListening, 
    stopListening: sttStopListening, 
    error: sttError,
    isSupported: isSTTSupported
  } = useSTT();

  const {
    isSpeaking: isTtsSpeaking,
    isSupported: isTTSSupported,
    voices,
    selectedVoiceURI,
    ttsEnabled,
    speak: speakTTS,
    cancel: cancelTTS,
    setSelectedVoiceURI,
    setTtsEnabled,
    error: ttsError
  } = useTTS();

  useEffect(() => {
    const quizCompleted = getItem<boolean>(QUIZ_COMPLETED_KEY, false);
    const savedPrefs = getItem<UserPreferences | null>(USER_PREFERENCES_KEY, null);
    const savedHistory = getItem<ChatMessageType[]>(CHAT_HISTORY_KEY, []);
    
    setUserPreferences(savedPrefs);
    setMessages(savedHistory);

    if (!quizCompleted) {
      setIsQuizModalOpen(true);
    } else {
      if (savedHistory.length === 0) {
         addMessage({ role: 'assistant', content: "Greetings. I am Aizen. How may I assist you on your path today?" });
      }
    }
    setIsInitialLoading(false);
  }, []);

  // Combined useEffect to manage input state during STT
  useEffect(() => {
    if (isSttListening) {
      let currentRecognizedText = finalTranscriptSegment || ''; // Full final text from STT for current session
      let newComposedInput = sttBaseText;

      if (currentRecognizedText) {
        newComposedInput = (sttBaseText ? sttBaseText.trim() + ' ' : '') + currentRecognizedText;
      }
      
      if (interimTranscript) {
        newComposedInput = (newComposedInput ? newComposedInput.trim() + ' ' : '') + interimTranscript;
      }
      setInput(newComposedInput.trim());
    }
    // When STT stops, the 'input' field retains the last value set by this effect or user typing.
  }, [isSttListening, finalTranscriptSegment, interimTranscript, sttBaseText]);


  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      setItem(CHAT_HISTORY_KEY, messages);
    }
  }, [messages]);

  useEffect(() => {
    if (sttError) {
      toast({ title: "Voice Input Error", description: sttError, variant: "destructive" });
    }
  }, [sttError, toast]);

  useEffect(() => {
    if (ttsError) {
      toast({ title: "Voice Output Error", description: ttsError, variant: "destructive" });
    }
  }, [ttsError, toast]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior });
  };
  
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const addMessage = (messageContent: Omit<ChatMessageType, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessageType = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
      ...messageContent,
    };
    setMessages(prev => [...prev, newMessage]);
    if (newMessage.role === 'assistant' && ttsEnabled && typeof newMessage.content === 'string') {
      speakTTS(newMessage.content);
    }
    return newMessage;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessageContent = input.trim();
    addMessage({ role: 'user', content: userMessageContent });
    setInput(''); // Clear input after sending
    setSttBaseText(''); // Clear STT base text as well
    setIsSending(true);
    addMessage({ role: 'system', content: "Aizen is meditating..." });

    const messagesForAI = [...messages, { id: 'temp', role: 'user', content: userMessageContent, timestamp: Date.now() }];

    const result = await handleChatMessageAction({
      message: userMessageContent,
      chatHistory: messagesForAI,
      userPreferences,
    });
    
    setMessages(prev => prev.filter(msg => !(msg.role === 'system' && msg.content === "Aizen is meditating...")));

    if (result.response) {
      addMessage({ role: 'assistant', content: result.response });
    } else if (result.error) {
      addMessage({ role: 'error', content: result.error });
      if (ttsEnabled) speakTTS(result.error);
    }
    setIsSending(false);
  };

  const handleSavePreferences = (prefs: UserPreferences) => {
    setUserPreferences(prefs);
    setItem(USER_PREFERENCES_KEY, prefs);
    setItem(QUIZ_COMPLETED_KEY, true);
    setIsQuizModalOpen(false);
    toast({ title: "Preferences Saved", description: "Aizen will now respond according to your preferences." });
    if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant' && messages[0].content.startsWith("Greetings."))) {
        setMessages([]); 
        addMessage({ role: 'assistant', content: "Greetings. I am Aizen. How may I assist you on your path today?" });
    }
  };

  const handleGenerateHaiku = async (theme: string) => {
    setIsHaikuModalOpen(false);
    setIsSending(true);
    addMessage({ role: 'system', content: `Aizen contemplates a haiku on "${theme}"...` });
    
    const result = await handleGenerateHaikuAction({ theme });

    setMessages(prev => prev.filter(msg => !(msg.role === 'system' && msg.content.startsWith("Aizen contemplates a haiku"))));

    if (result.haiku) {
      addMessage({ role: 'assistant', content: result.haiku, type: 'haiku' });
    } else if (result.error) {
      addMessage({ role: 'error', content: result.error });
       if (ttsEnabled) speakTTS(result.error);
    }
    setIsSending(false);
  };

  const handleClearChat = () => {
    setMessages([]);
    removeItem(CHAT_HISTORY_KEY);
    addMessage({ role: 'assistant', content: "The path is cleared. How may I assist you anew?" });
    toast({ title: "Chat Cleared", description: "Your conversation history has been wiped." });
  };

  const handleStartListening = useCallback(() => {
    setSttBaseText(input.trim()); // Save current input text, trimmed
    sttStartListening(); // Call the original startListening from useSTT
  }, [input, sttStartListening]);

  const handleStopListening = useCallback(() => {
    sttStopListening(); // Call the original stopListening from useSTT
    // The input state should already be updated by the useEffect, so no need to setSttBaseText here.
  }, [sttStopListening]);


  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-foreground p-4 pt-20">
        <p className="text-xl">Initializing Aizen...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-transparent">
      <Header
        onOpenQuiz={() => setIsQuizModalOpen(true)}
        onOpenHaikuModal={() => setIsHaikuModalOpen(true)}
        onClearChat={handleClearChat}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        setSelectedVoiceURI={setSelectedVoiceURI}
        isTTSSupported={isTTSSupported}
      />
      
      <main 
        ref={chatContainerRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 pt-20 pb-28 bg-transparent"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>
      </main>

      {showScrollToBottom && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-24 right-4 z-10 bg-background/80 hover:bg-accent text-foreground rounded-full shadow-lg"
          onClick={() => scrollToBottom()}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}

      <ChatInput
        input={input} // Pass the 'input' state directly
        setInput={setInput}
        onSendMessage={handleSendMessage}
        isSending={isSending}
        isListening={isSttListening}
        startListening={handleStartListening} // Use wrapped handler
        stopListening={handleStopListening}   // Use wrapped handler
        isSTTSupported={isSTTSupported}
        sttError={sttError}
      />

      <UserPreferencesQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => {
            setIsQuizModalOpen(false);
            if (!getItem<boolean>(QUIZ_COMPLETED_KEY, false)) {
                 setItem(QUIZ_COMPLETED_KEY, true); 
                 if (messages.length === 0) {
                    addMessage({ role: 'assistant', content: "Greetings. I am Aizen. How may I assist you on your path today?" });
                 }
            }
        }}
        onSavePreferences={handleSavePreferences}
        initialPreferences={userPreferences}
      />
      <HaikuModal
        isOpen={isHaikuModalOpen}
        onClose={() => setIsHaikuModalOpen(false)}
        onGenerateHaiku={handleGenerateHaiku}
        isGenerating={isSending}
      />
    </div>
  );
}
    