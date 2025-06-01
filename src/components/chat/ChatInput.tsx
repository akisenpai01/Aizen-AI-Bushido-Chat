
"use client";

import React, { useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Mic, StopCircle } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  onSendMessage: () => void;
  isSending: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSTTSupported: boolean;
  sttError: string | null;
}

export default function ChatInput({
  input,
  setInput,
  onSendMessage,
  isSending,
  isListening,
  startListening,
  stopListening,
  isSTTSupported,
  sttError
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (input.trim() && !isSending) {
        onSendMessage();
      }
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 p-2 sm:p-4 bg-background/70 backdrop-blur-md border-t border-border/30">
      <div className="flex items-end space-x-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Path of words..."}
          className="flex-1 resize-none overflow-y-auto max-h-32 bg-background/70 text-foreground placeholder:text-muted-foreground border border-border/50 focus-visible:ring-primary/50"
          rows={1}
          disabled={isSending || isListening}
        />
        {isSTTSupported && (
          <Button
            variant="ghost"
            size="icon"
            onClick={isListening ? stopListening : startListening}
            disabled={isSending}
            className="text-foreground hover:text-primary disabled:opacity-50"
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <StopCircle className="h-6 w-6 text-destructive" /> : <Mic className="h-6 w-6" />}
          </Button>
        )}
        <Button
          onClick={onSendMessage}
          disabled={!input.trim() || isSending || isListening}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Send message"
        >
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </div>
       {sttError && <p className="text-xs text-destructive mt-1 ml-1">{sttError}</p>}
    </div>
  );
}
