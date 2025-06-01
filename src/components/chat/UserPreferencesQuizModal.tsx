
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { UserPreferences, QuizData } from '@/types';

interface UserPreferencesQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePreferences: (preferences: UserPreferences) => void;
  initialPreferences?: UserPreferences | null;
}

const defaultQuizData: QuizData = {
  tone: 'Guiding',
  answerLength: 'Moderate',
  bushidoInterest: 'Moderate',
};

export default function UserPreferencesQuizModal({
  isOpen,
  onClose,
  onSavePreferences,
  initialPreferences,
}: UserPreferencesQuizModalProps) {
  const [quizData, setQuizData] = useState<QuizData>(initialPreferences || defaultQuizData);

  useEffect(() => {
    if (isOpen) {
      setQuizData(initialPreferences || defaultQuizData);
    }
  }, [isOpen, initialPreferences]);

  const handleSave = () => {
    onSavePreferences(quizData);
    onClose();
  };

  const setField = (field: keyof QuizData, value: string) => {
    setQuizData(prev => ({ ...prev, [field]: value as any }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Personalize Aizen</DialogTitle>
          <DialogDescription>
            Help Aizen understand your preferences for a more tailored experience.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-2">
          <div>
            <Label className="font-semibold">Preferred Tone</Label>
            <RadioGroup value={quizData.tone} onValueChange={(value) => setField('tone', value)} className="mt-2 space-y-1">
              {(['Formal', 'Guiding', 'Concise'] as UserPreferences['tone'][]).map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`tone-${option}`} />
                  <Label htmlFor={`tone-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="font-semibold">Answer Length</Label>
            <RadioGroup value={quizData.answerLength} onValueChange={(value) => setField('answerLength', value)} className="mt-2 space-y-1">
              {(['Detailed', 'Moderate', 'Brief'] as UserPreferences['answerLength'][]).map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`length-${option}`} />
                  <Label htmlFor={`length-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="font-semibold">Interest in Bushido Philosophy</Label>
            <RadioGroup value={quizData.bushidoInterest} onValueChange={(value) => setField('bushidoInterest', value)} className="mt-2 space-y-1">
              {(['High', 'Moderate', 'Low'] as UserPreferences['bushidoInterest'][]).map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`bushido-${option}`} />
                  <Label htmlFor={`bushido-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
