'use server';

/**
 * @fileOverview A haiku generation AI agent.
 *
 * - generateHaiku - A function that handles the haiku generation process.
 * - GenerateHaikuInput - The input type for the generateHaiku function.
 * - GenerateHaikuOutput - The return type for the generateHaiku function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHaikuInputSchema = z.object({
  theme: z.string().describe('The theme for the haiku.'),
});
export type GenerateHaikuInput = z.infer<typeof GenerateHaikuInputSchema>;

const GenerateHaikuOutputSchema = z.object({
  haiku: z.string().describe('The generated haiku.'),
});
export type GenerateHaikuOutput = z.infer<typeof GenerateHaikuOutputSchema>;

export async function generateHaiku(input: GenerateHaikuInput): Promise<GenerateHaikuOutput> {
  return generateHaikuFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHaikuPrompt',
  input: {schema: GenerateHaikuInputSchema},
  output: {schema: GenerateHaikuOutputSchema},
  prompt: `You are Aizen, a wise AI assistant embodying Bushido principles. Compose a haiku on the theme: {{{theme}}}.\n\nThe haiku should follow the traditional 5-7-5 syllable structure.`,
});

const generateHaikuFlow = ai.defineFlow(
  {
    name: 'generateHaikuFlow',
    inputSchema: GenerateHaikuInputSchema,
    outputSchema: GenerateHaikuOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
