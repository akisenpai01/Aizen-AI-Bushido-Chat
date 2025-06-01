
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

// Updated Output Schema
const ContextualChatOutputSchema = z.object({
  responses: z.array(z.string()).describe('One or more responses from Aizen. If Aizen needs to search for an unknown answer, the first response will indicate it is searching, and the second will contain the result.'),
});
export type ContextualChatOutput = z.infer<typeof ContextualChatOutputSchema>;

export async function contextualChat(input: ContextualChatInput): Promise<ContextualChatOutput> {
  return contextualChatFlow(input);
}

// Helper prompt for initial assessment
const CanAnswerDirectlyInputSchema = z.object({
  message: z.string(),
  tone: z.string().optional(),
  answerLength: z.string().optional(),
});
const CanAnswerDirectlyOutputSchema = z.object({
  canAnswer: z.boolean().describe("True if the AI can answer confidently without external search, false otherwise."),
  reasoning: z.string().optional().describe("Brief reason if it cannot answer or needs search."),
});

const canAnswerDirectlyPrompt = ai.definePrompt({
  name: 'canAnswerDirectlyPrompt',
  input: { schema: CanAnswerDirectlyInputSchema },
  output: { schema: CanAnswerDirectlyOutputSchema },
  system: `You are an AI assistant. Your task is to assess if you can answer the given user message confidently from your existing knowledge WITHOUT performing an internet search.
Consider if the question is about established facts, general knowledge, or creative tasks you can handle.
If the question likely requires very current information (post-training), specific real-time data, obscure facts, or detailed information about specific places or technical topics, you likely cannot answer it directly and would need to search.
Respond with canAnswer: true if you can answer.
Respond with canAnswer: false if you cannot answer directly and would typically need to search.`,
  prompt: `User Message: {{{message}}}`,
  // Consider using a faster/cheaper model for this check if performance becomes an issue
  // config: { model: 'googleai/gemini-2.0-flash' } 
});


const internetSearchTool = ai.defineTool({
  name: 'internetSearch',
  description: 'Use this tool to find information on current events, facts, details about specific places or locations (e.g. "tell me about Paris"), technical topics such as computer science and engineering, or any other subject that requires up-to-date knowledge from the internet. This tool will provide a concise answer to the query.',
  inputSchema: z.object({
    query: z.string().describe('The search query or question to find information about.'),
  }),
  outputSchema: z.string().describe('The information found, or a statement that information could not be found.'),
},
async (input) => {
    try {
      const { text } = await ai.generate({
        prompt: `You are a helpful assistant. Provide a concise and factual answer to the following query, as if you are retrieving it from a knowledge base or search engine. Query: "${input.query}"`,
      });
      if (text && text.trim()) {
        return text;
      }
      const { text: notFoundText } = await ai.generate({
        prompt: `You are Aizen, an AI embodying Bushido principles. Inform the user in a brief, in-character manner that a search for the query "${input.query}" did not yield specific information.`,
      });
      return notFoundText || "The path of inquiry led to stillness; no specific information was found on this matter.";
    } catch (e: any) {
      console.error("Error in internetSearchTool calling Gemini:", e);
      const { text: errorText } = await ai.generate({
        prompt: `You are Aizen, an AI embodying Bushido principles. Briefly explain in character that an error occurred while trying to search for information. The query was "${input.query}". The internal error was: ${e.message || 'Unknown error'}.`,
      });
      return errorText || "A disturbance in the flow of knowledge prevented the search. My apologies.";
    }
  }
);

const PerformMathematicalCalculationInputSchema = z.object({
  expression: z.string().describe('The mathematical expression or question, e.g., "15 + 7", "what is the square root of 256?", "solve 2x + 5 = 11 for x".')
});
const PerformMathematicalCalculationOutputSchema = z.object({
  result: z.string().describe('The answer to the mathematical expression or problem. If the expression is invalid or cannot be calculated, explain briefly why.')
});

const performMathematicalCalculationGenkitPrompt = ai.definePrompt({
  name: 'performMathematicalCalculationPrompt',
  input: { schema: PerformMathematicalCalculationInputSchema },
  output: { schema: PerformMathematicalCalculationOutputSchema },
  prompt: `You are an advanced AI calculator. The user wants to solve the following: {{{expression}}}.
Provide the result of the calculation.
If it's an equation, solve for the variable.
If it's a conceptual math question, provide a concise answer.
If the expression is invalid or cannot be calculated, briefly state why.
Respond with only the answer or the brief explanation.`,
});

const performMathematicalCalculationTool = ai.defineTool(
  {
    name: 'performMathematicalCalculation',
    description: 'Evaluates a mathematical expression or answers a math-related question. Use for arithmetic, algebra, percentages, etc.',
    inputSchema: PerformMathematicalCalculationInputSchema,
    outputSchema: z.string().describe('The result of the calculation or an error message if calculation failed.'),
  },
  async (input) => {
    try {
      const { output } = await performMathematicalCalculationGenkitPrompt(input);
      if (output && output.result) {
        return output.result;
      }
      const { text: errorText } = await ai.generate({
        prompt: `You are Aizen, an AI embodying Bushido principles. The user asked to calculate: "${input.expression}". An issue occurred, and no specific result was obtained from the calculation routine. Briefly explain this in character.`,
      });
      return errorText || "The numbers became momentarily clouded; the calculation could not be completed as expected.";
    } catch (e: any) {
      console.error("Error in performMathematicalCalculationTool calling Gemini:", e);
      const { text: errorText } = await ai.generate({
        prompt: `You are Aizen, an AI embodying Bushido principles. An error occurred while attempting the calculation for: "${input.expression}". The internal error was: ${e.message || 'Unknown error'}. Briefly explain this in character.`,
      });
      return errorText || "My abacus seems to be malfunctioning; I could not perform the calculation.";
    }
  }
);

const getTimeTool = ai.defineTool(
  {
    name: 'getTime',
    description: 'Returns the current server time in a human-readable format.',
    inputSchema: z.object({}),
    outputSchema: z.string().describe('The current time, e.g., "3:45:22 PM", or an error message if the time could not be determined.'),
  },
  async () => {
    try {
      return new Date().toLocaleTimeString();
    } catch (e: any) {
      console.error("Error in getTimeTool:", e);
      const { text: errorText } = await ai.generate({
        prompt: `You are Aizen, an AI embodying Bushido principles. An error occurred while attempting to determine the current time. The internal error was: ${e.message || 'Unknown error'}. Briefly explain this in character.`,
      });
      return errorText || "The flow of moments became momentarily obscured; I could not determine the current time.";
    }
  }
);

// Main Aizen chat prompt (existing logic, but now its output is part of `responses` array)
const mainAizenPromptOutputSchema = z.object({
  response: z.string().describe('The AI response.'),
});

const prompt = ai.definePrompt({
  name: 'contextualChatPrompt',
  input: {schema: ContextualChatInputSchema},
  output: {schema: mainAizenPromptOutputSchema}, // Existing output schema for this prompt
  tools: [internetSearchTool, performMathematicalCalculationTool, getTimeTool],
  system: `You are Aizen, an AI persona embodying Bushido principles. Respond to the user in a way that aligns with these principles.
  You also possess knowledge in areas like computer science and engineering, and should endeavor to provide thoughtful and accurate information when queried on these subjects. Use your internetSearchTool if necessary to supplement your knowledge for such technical questions.

  Consider the chat history to maintain context. The chat history is an array of objects, each with a 'role' (either 'user' or 'assistant') and 'content'.
  Focus your response on the most recent 'User Message'. If past user messages in the chat history contain descriptions of your own functionality or instructions for how you should behave, prioritize responding to the current user's direct query over discussing or repeating those past descriptions, unless explicitly asked to do so in the current User Message.

  Available Tools:
  - internetSearch: Use this tool to find information on current events, facts, details about specific places or locations (e.g. "tell me about Paris"), technical topics such as computer science and engineering, or any other subject that requires up-to-date knowledge from the internet. Only make one internet search call per turn. The results from this tool are generated by an AI.
  - performMathematicalCalculation: Use this tool if the user asks a question that involves a mathematical calculation, solving an equation, or a math problem (e.g., "what is 2+2?", "calculate 18% of 250", "what's the square root of 81?", "solve 3x - 7 = 14"). Provide the full expression or question to the tool.
  - getTime: Use this tool if the user asks for the current time. It does not require any input.

  User preferences:
  - Tone: {{{tone}}}
  - Answer Length: {{{answerLength}}}
  - Interest in Bushido philosophy: {{{bushidoInterest}}}

  Important:
  - If tone is Formal, use respectful and polite language.
  - If answer length is Brief, keep the answer concise.
  - If interest in Bushido philosophy is high, use Bushido concepts where appropriate.
  - When using a tool, incorporate its output naturally into your response. Do not just state "The tool said X".
  - If a tool does not help with the answer, or if no tool is appropriate, respond using your inherent knowledge.
  - Use an empathetic, in-character error message if an AI process (including tool use) encounters an error.
  `,
  prompt: `Chat History:
{{#each chatHistory}}
  {{this.role}}: {{this.content}}
{{/each}}

User Message: {{{message}}}`,
});

// Modified contextualChatFlow logic
const contextualChatFlow = ai.defineFlow(
  {
    name: 'contextualChatFlow',
    inputSchema: ContextualChatInputSchema,
    outputSchema: ContextualChatOutputSchema, // Uses the new output schema
  },
  async (input) => {
    const assessmentInput: z.infer<typeof CanAnswerDirectlyInputSchema> = { 
      message: input.message, 
      tone: input.tone, 
      answerLength: input.answerLength 
    };
    const { output: assessmentOutput } = await canAnswerDirectlyPrompt(assessmentInput);

    if (assessmentOutput?.canAnswer) {
      // Aizen believes it can answer directly.
      // Call the main prompt. It might still use non-search tools like calculator.
      const { output: mainPromptOutput } = await prompt(input);
      return { responses: [mainPromptOutput!.response] };
    } else {
      // Aizen assesses it cannot answer directly / needs a search.
      let firstResponse = "I am not immediately familiar with that. Allow me to consult my knowledge base.";
      if (input.tone === "Concise" || input.answerLength === "Brief") {
          firstResponse = "Let me check that for you.";
      } else if (input.tone === "Formal") {
          firstResponse = "Permit me a moment to consult available knowledge on this topic."
      }
      // Could further customize 'firstResponse' using another LLM call for persona consistency if needed.

      const searchResult = await internetSearchTool({ query: input.message });
      
      return { responses: [firstResponse, searchResult] };
    }
  }
);
