
"use client";

import { BrainCircuit, Cog } from "lucide-react";
import SettingsMenu from "@/components/SettingsMenu";
import type { UserPreferences } from "@/types";
import type { Dispatch, SetStateAction } from "react";

interface HeaderProps {
  onOpenQuiz: () => void;
  onOpenHaikuModal: () => void;
  onClearChat: () => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (uri: string | null) => void;
  isTTSSupported: boolean;
}

export default function Header({ 
  onOpenQuiz, 
  onOpenHaikuModal, 
  onClearChat,
  ttsEnabled,
  setTtsEnabled,
  voices,
  selectedVoiceURI,
  setSelectedVoiceURI,
  isTTSSupported
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 h-16 bg-background/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-headline font-semibold text-foreground">Aizen</h1>
      </div>
      <SettingsMenu
        onOpenQuiz={onOpenQuiz}
        onOpenHaikuModal={onOpenHaikuModal}
        onClearChat={onClearChat}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        setSelectedVoiceURI={setSelectedVoiceURI}
        isTTSSupported={isTTSSupported}
      />
    </header>
  );
}
