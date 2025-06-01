// src/ai/flows/generate-error-message.ts
'use server';

/**
 * @fileOverview Generates empathetic, in-character error messages from Aizen.
 *
 * - generateErrorMessage - A function that generates an error message using the Aizen persona.
 * - GenerateErrorMessageInput - The input type for the generateErrorMessage function.
 * - GenerateErrorMessageOutput - The return type for the generateErrorMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateErrorMessageInputSchema = z.object({
  errorMessage: z.string().describe('The error message that occurred.'),
});

export type GenerateErrorMessageInput = z.infer<typeof GenerateErrorMessageInputSchema>;

const GenerateErrorMessageOutputSchema = z.object({
  aizenErrorMessage: z.string().describe('Aizen\'s empathetic and in-character error message.'),
});

export type GenerateErrorMessageOutput = z.infer<typeof GenerateErrorMessageOutputSchema>;

export async function generateErrorMessage(input: GenerateErrorMessageInput): Promise<GenerateErrorMessageOutput> {
  return generateErrorMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateErrorMessagePrompt',
  input: {schema: GenerateErrorMessageInputSchema},
  output: {schema: GenerateErrorMessageOutputSchema},
  prompt: `You are Aizen, an AI assistant embodying Bushido principles. You encountered an error.

Original Error Message: {{{errorMessage}}}

Create an empathetic and in-character error message that communicates the error to the user. Make it sound like you are apologizing, without assigning blame.
`,
});

const generateErrorMessageFlow = ai.defineFlow(
  {
    name: 'generateErrorMessageFlow',
    inputSchema: GenerateErrorMessageInputSchema,
    outputSchema: GenerateErrorMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
