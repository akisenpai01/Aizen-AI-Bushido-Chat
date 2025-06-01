
"use server";

import { contextualChat, type ContextualChatInput, type ContextualChatOutput } from "@/ai/flows/contextual-chat";
import { generateHaiku, type GenerateHaikuInput, type GenerateHaikuOutput } from "@/ai/flows/generate-haiku";
import { generateErrorMessage, type GenerateErrorMessageInput, type GenerateErrorMessageOutput } from "@/ai/flows/generate-error-message";
import type { UserPreferences, ChatMessage } from "@/types";

const MAX_HISTORY_LENGTH = 10;

interface HandleChatMessageActionInput {
  message: string;
  chatHistory: ChatMessage[];
  userPreferences: UserPreferences | null;
}

export async function handleChatMessageAction(
  input: HandleChatMessageActionInput
): Promise<{ responses?: string[]; error?: string }> { // Return type changed
  try {
    const historyForAI = input.chatHistory
      .slice(-MAX_HISTORY_LENGTH)
      .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content as string }));

    const aiInput: ContextualChatInput = {
      message: input.message,
      chatHistory: historyForAI,
      tone: input.userPreferences?.tone,
      answerLength: input.userPreferences?.answerLength,
      bushidoInterest: input.userPreferences?.bushidoInterest,
    };
    const result: ContextualChatOutput = await contextualChat(aiInput); // result now has { responses: string[] }
    return { responses: result.responses }; // Pass the array
  } catch (e: any) {
    console.error("Error in handleChatMessageAction:", e);
    try {
      const errorInput: GenerateErrorMessageInput = { errorMessage: e.message || "An unknown error occurred." };
      const formattedError: GenerateErrorMessageOutput = await generateErrorMessage(errorInput);
      return { error: formattedError.aizenErrorMessage };
    } catch (formatError: any) {
      console.error("Error formatting error message:", formatError);
      return { error: "A tranquil mind is a strong mind. An unexpected disturbance occurred. Please try again." }; 
    }
  }
}

interface HandleGenerateHaikuActionInput {
  theme: string;
}

export async function handleGenerateHaikuAction(
  input: HandleGenerateHaikuActionInput
): Promise<{ haiku?: string; error?: string }> {
  try {
    const aiInput: GenerateHaikuInput = { theme: input.theme };
    const result: GenerateHaikuOutput = await generateHaiku(aiInput);
    return { haiku: result.haiku };
  } catch (e: any) {
    console.error("Error in handleGenerateHaikuAction:", e);
    try {
      const errorInput: GenerateErrorMessageInput = { errorMessage: e.message || "Haiku inspiration is fleeting." };
      const formattedError: GenerateErrorMessageOutput = await generateErrorMessage(errorInput);
      return { error: formattedError.aizenErrorMessage };
    } catch (formatError: any) {
      console.error("Error formatting haiku error message:", formatError);
      return { error: "The path to poetry is sometimes clouded. A disturbance occurred. Please try again." };
    }
  }
}

export async function handleFormatErrorAction(
  errorMessage: string
): Promise<{ aizenErrorMessage: string }> {
   try {
      const errorInput: GenerateErrorMessageInput = { errorMessage: errorMessage };
      const formattedError: GenerateErrorMessageOutput = await generateErrorMessage(errorInput);
      return { aizenErrorMessage: formattedError.aizenErrorMessage };
    } catch (formatError: any) {
      console.error("Error formatting error message:", formatError);
      return { aizenErrorMessage: "Even in adversity, seek calm. An error occurred." }; 
    }
}
