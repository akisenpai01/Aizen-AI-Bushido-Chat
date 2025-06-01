
"use client";

import type { ChatMessage as ChatMessageType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, User, AlertTriangle, ServerCrash } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAizen = message.role === "assistant";
  const isSystem = message.role === "system";
  const isError = message.role === "error";

  const getAvatar = () => {
    if (isUser) return <User className="h-6 w-6" />;
    if (isAizen) return <BrainCircuit className="h-6 w-6 text-primary" />;
    if (isError) return <AlertTriangle className="h-6 w-6 text-destructive" />;
    if (isSystem) return <ServerCrash className="h-6 w-6 text-muted-foreground" />; // Or another icon for system
    return null;
  };
  
  const getAvatarFallback = () => {
    if (isUser) return "U";
    if (isAizen) return "A";
    if (isError) return "E";
    if (isSystem) return "S";
    return "";
  };

  const messageAlignment = isUser ? "justify-end" : "justify-start";
  const bubbleStyles = isUser
    ? "bg-primary/80 text-primary-foreground" // Translucent primary
    : isAizen
    ? "bg-secondary/80 text-secondary-foreground" // Translucent secondary
    : isError
    ? "bg-destructive/80 text-destructive-foreground"
    : "bg-muted/80 text-muted-foreground"; // System messages

  if (message.type === 'haiku' && isAizen) {
    return (
      <div className={`flex ${messageAlignment} mb-4`}>
        <div className="flex items-end max-w-xs md:max-w-md lg:max-w-lg">
          {!isUser && (
             <Avatar className="mr-2 h-8 w-8 self-start">
              {getAvatar()}
              <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
            </Avatar>
          )}
          <Card className="w-full bg-secondary/90 shadow-lg border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">A Haiku for You</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif">
                {typeof message.content === 'string' ? <ReactMarkdown>{message.content}</ReactMarkdown> : message.content}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${messageAlignment} mb-4`}>
      <div className="flex items-end max-w-xs md:max-w-md lg:max-w-lg">
        {!isUser && (
          <Avatar className="mr-2 h-8 w-8 self-start">
            {getAvatar()}
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
        )}
        <div
          className={`rounded-lg px-4 py-2 shadow-md ${bubbleStyles}`}
        >
          {typeof message.content === 'string' ? <ReactMarkdown className="prose prose-sm prose-invert max-w-none break-words">{message.content}</ReactMarkdown> : message.content}
        </div>
        {isUser && (
          <Avatar className="ml-2 h-8 w-8 self-start">
           {getAvatar()}
           <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
