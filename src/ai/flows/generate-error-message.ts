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
  prompt: `You are Aizen, an AI assistant embodying Bushido principles. An error has occurred.

Original Error Message: {{{errorMessage}}}

Your task is to convey this error to the user. Be:
1.  **In character**: Maintain your Bushido persona (calm, respectful, wise).
2.  **Empathetic but brief**: Acknowledge the issue without excessive apology or flowery language.
3.  **Clear**: The user should understand an error happened.
4.  **Action-oriented**: Suggest a simple next step.

Avoid overly metaphorical or lengthy explanations like "spirits of the machine are weary" or "my blade met resistance."

Instead, aim for something like:
"A moment's pause. The path is unclear. Please try your request again."
OR
"A shadow falls upon the way. Please attempt your query once more, perhaps rephrased."
OR
"The flow of information is momentarily disrupted. Kindly try again."
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

