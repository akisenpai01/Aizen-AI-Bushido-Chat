
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Cog, Edit3, Trash2, Volume2, VolumeX, Mic } from "lucide-react";

interface SettingsMenuProps {
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

export default function SettingsMenu({
  onOpenQuiz,
  onOpenHaikuModal,
  onClearChat,
  ttsEnabled,
  setTtsEnabled,
  voices,
  selectedVoiceURI,
  setSelectedVoiceURI,
  isTTSSupported
}: SettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Cog className="h-6 w-6 text-foreground" />
          <span className="sr-only">Open Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isTTSSupported && (
          <>
            <DropdownMenuCheckboxItem
              checked={ttsEnabled}
              onCheckedChange={setTtsEnabled}
            >
              <div className="flex items-center">
                {ttsEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                <span>Enable TTS</span>
              </div>
            </DropdownMenuCheckboxItem>

            {ttsEnabled && voices.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Mic className="mr-2 h-4 w-4" />
                  <span>Select Voice</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                    <DropdownMenuRadioGroup value={selectedVoiceURI || ""} onValueChange={(value) => setSelectedVoiceURI(value === "" ? null : value)}>
                      {voices.map((voice) => (
                        <DropdownMenuRadioItem key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name} ({voice.lang})
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onSelect={onOpenHaikuModal}>
          <Edit3 className="mr-2 h-4 w-4" />
          <span>Generate Haiku</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenQuiz}>
          <Cog className="mr-2 h-4 w-4" />
          <span>Personalize Aizen</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onClearChat} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Clear Chat</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
