
"use server";

import { contextualChat, type ContextualChatInput, type ContextualChatOutput } from "@/ai/flows/contextual-chat";
import { generateHaiku, type GenerateHaikuInput, type GenerateHaikuOutput } from "@/ai/flows/generate-haiku";
import { generateErrorMessage, type GenerateErrorMessageInput, type GenerateErrorMessageOutput } from "@/ai/flows/generate-error-message";
import type { UserPreferences, ChatMessage } from "@/types";

const MAX_HISTORY_LENGTH = 10;

const API_KEY_ERROR_MESSAGE = "The GOOGLE_API_KEY is missing or invalid. Please ensure it is correctly set in your .env file and restart the server.";
const GENERIC_AI_ERROR_MESSAGE = "Aizen is currently unable to process this request due to an internal disturbance. Please try again later.";

function isApiKeyInvalid(): boolean {
  const apiKey = process.env.GOOGLE_API_KEY;
  return !apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.trim() === "";
}

interface HandleChatMessageActionInput {
  message: string;
  chatHistory: ChatMessage[];
  userPreferences: UserPreferences | null;
}

export async function handleChatMessageAction(
  input: HandleChatMessageActionInput
): Promise<{ responses?: string[]; error?: string }> {
  if (isApiKeyInvalid()) {
    console.error("Error in handleChatMessageAction: GOOGLE_API_KEY is not set or is a placeholder.");
    return { error: API_KEY_ERROR_MESSAGE };
  }
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
    const result: ContextualChatOutput = await contextualChat(aiInput);
    return { responses: result.responses };
  } catch (e: any) {
    console.error("Error in handleChatMessageAction:", e);
    // Check if the error is due to API key again, as nested calls might still fail
    if (e.message && (e.message.includes('GEMINI_API_KEY') || e.message.includes('GOOGLE_API_KEY'))) {
      return { error: API_KEY_ERROR_MESSAGE };
    }
    try {
      const errorInput: GenerateErrorMessageInput = { errorMessage: e.message || "An unknown error occurred." };
      const formattedError: GenerateErrorMessageOutput = await generateErrorMessage(errorInput);
      return { error: formattedError.aizenErrorMessage };
    } catch (formatError: any) {
      console.error("Error formatting error message:", formatError);
      return { error: GENERIC_AI_ERROR_MESSAGE };
    }
  }
}

interface HandleGenerateHaikuActionInput {
  theme: string;
}

export async function handleGenerateHaikuAction(
  input: HandleGenerateHaikuActionInput
): Promise<{ haiku?: string; error?: string }> {
  if (isApiKeyInvalid()) {
    console.error("Error in handleGenerateHaikuAction: GOOGLE_API_KEY is not set or is a placeholder.");
    return { error: API_KEY_ERROR_MESSAGE };
  }
  try {
    const aiInput: GenerateHaikuInput = { theme: input.theme };
    const result: GenerateHaikuOutput = await generateHaiku(aiInput);
    return { haiku: result.haiku };
  } catch (e: any) {
    console.error("Error in handleGenerateHaikuAction:", e);
    if (e.message && (e.message.includes('GEMINI_API_KEY') || e.message.includes('GOOGLE_API_KEY'))) {
      return { error: API_KEY_ERROR_MESSAGE };
    }
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
   if (isApiKeyInvalid()) {
    console.error("Error in handleFormatErrorAction: GOOGLE_API_KEY is not set or is a placeholder.");
    // This function is expected to return an AI-generated message,
    // so if the API key is missing, we return a direct message instead of trying to use AI.
    return { aizenErrorMessage: API_KEY_ERROR_MESSAGE };
   }
   try {
      const errorInput: GenerateErrorMessageInput = { errorMessage: errorMessage };
      const formattedError: GenerateErrorMessageOutput = await generateErrorMessage(errorInput);
      return { aizenErrorMessage: formattedError.aizenErrorMessage };
    } catch (formatError: any) {
      console.error("Error formatting error message:", formatError);
      if (formatError.message && (formatError.message.includes('GEMINI_API_KEY') || formatError.message.includes('GOOGLE_API_KEY'))) {
        return { aizenErrorMessage: API_KEY_ERROR_MESSAGE };
      }
      return { aizenErrorMessage: GENERIC_AI_ERROR_MESSAGE };
    }
}
