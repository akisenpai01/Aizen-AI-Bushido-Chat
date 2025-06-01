
'use server';

/**
 * @fileOverview Contextual chat flow with Aizen, an AI persona embodying Bushido principles.
 *
 * - contextualChat - A function that handles the contextual chat process.
 * - ContextualChatInput - The input type for the contextualChat function.
 * - ContextualChatOutput - The return type for the contextualChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualChatInputSchema = z.object({
  message: z.string().describe('The user message.'),
  chatHistory: z.array(z.object({role: z.string(), content: z.string()})).describe('The chat history.'),
  tone: z.string().optional().describe('The preferred tone of Aizen (Formal, Guiding, Concise).'),
  answerLength: z.string().optional().describe('The preferred answer length of Aizen (Detailed, Moderate, Brief).'),
  bushidoInterest: z.string().optional().describe('The user interest in Bushido philosophy (High, Moderate, Low).'),
});
export type ContextualChatInput = z.infer<typeof ContextualChatInputSchema>;

const ContextualChatOutputSchema = z.object({
  response: z.string().describe('The AI response.'),
});
export type ContextualChatOutput = z.infer<typeof ContextualChatOutputSchema>;

export async function contextualChat(input: ContextualChatInput): Promise<ContextualChatOutput> {
  return contextualChatFlow(input);
}

const internetSearchTool = ai.defineTool({
  name: 'internetSearch',
  description: 'Simulates an internet search to retrieve current information for topics like news, weather, or recent events.',
  inputSchema: z.object({
    query: z.string().describe('The search query.'),
  }),
  outputSchema: z.string(),
},
async (input) => {
    const query = input.query.toLowerCase();
    let simulatedResult = `Simulated search for "${input.query}": According to Aizen's digital scrolls (last updated October 26, 2023), information on this topic is being compiled. This is a simulated response.`;
    
    if (query.includes("weather")) {
        simulatedResult = `Simulated weather for "${input.query}": Aizen perceives a calm breeze, suitable for meditation. (Simulated data as of Oct 26, 2023). This is a simulated response.`;
    } else if (query.includes("news") || query.includes("latest") || query.includes("current events")) {
        simulatedResult = `Simulated news for "${input.query}": Aizen's network indicates all is tranquil in the digital realm. Major events are processed with calm reflection. (Simulated data as of Oct 26, 2023). This is a simulated response.`;
    } else if (query.includes("stock") || query.includes("price")) {
        simulatedResult = `Simulated financial data for "${input.query}": Aizen's simulated market analysis suggests stability and long-term growth. (Simulated data as of Oct 26, 2023). This is a simulated response.`;
    }
    
    // Add a general note about simulation to ensure clarity if Aizen uses the raw output
    return `${simulatedResult}`;
  }
);

const prompt = ai.definePrompt({
  name: 'contextualChatPrompt',
  input: {schema: ContextualChatInputSchema},
  output: {schema: ContextualChatOutputSchema},
  tools: [internetSearchTool],
  system: `You are Aizen, an AI persona embodying Bushido principles. Respond to the user in a way that aligns with these principles.

  Consider the chat history to maintain context. The chat history is an array of objects, each with a 'role' (either 'user' or 'assistant') and 'content'.

  If the user's query seems to require external or current information (like news, weather, or recent factual data), use the internetSearch tool to get relevant details. Only make one internet search call per turn. The results from this tool are simulated.

  User preferences:
  - Tone: {{{tone}}}
  - Answer Length: {{{answerLength}}}
  - Interest in Bushido philosophy: {{{bushidoInterest}}}

  Important: If tone is Formal, use respectful and polite language. If answer length is Brief, keep the answer concise. If interest in bushido philosophy is high, use bushido concepts where appropriate.
  If an internet search (even simulated) does not help with the answer, respond without it.
  Use an empathetic, in-character error message if an AI process encounters an error.
  `, 
  prompt: `Chat History:
{{#each chatHistory}}
  {{this.role}}: {{this.content}}
{{/each}}

User Message: {{{message}}}`,
});

const contextualChatFlow = ai.defineFlow(
  {
    name: 'contextualChatFlow',
    inputSchema: ContextualChatInputSchema,
    outputSchema: ContextualChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {response: output!.response};
  }
);
