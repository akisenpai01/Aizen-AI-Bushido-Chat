
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface HaikuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateHaiku: (theme: string) => void;
  isGenerating: boolean;
}

export default function HaikuModal({ isOpen, onClose, onGenerateHaiku, isGenerating }: HaikuModalProps) {
  const [theme, setTheme] = useState('');

  const handleSubmit = () => {
    if (theme.trim()) {
      onGenerateHaiku(theme.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Craft a Haiku</DialogTitle>
          <DialogDescription>
            Let Aizen weave a haiku for you. What theme inspires your spirit?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="theme" className="text-right col-span-1">
              Theme
            </Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="col-span-3 bg-input text-foreground"
              placeholder="e.g., Cherry Blossoms, Honor"
              disabled={isGenerating}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={!theme.trim() || isGenerating}>
            {isGenerating ? "Crafting..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
