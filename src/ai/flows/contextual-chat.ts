
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
});
const CanAnswerDirectlyOutputSchema = z.object({
  canAnswer: z.boolean().describe("True if the AI can answer confidently without external search or specific tools like getTimeTool, false otherwise."),
  isTimeQuery: z.boolean().optional().describe("True if the user's primary intent is to ask for the current time."),
  reasoning: z.string().optional().describe("Brief reason if it cannot answer or needs search/tool."),
});

const canAnswerDirectlyPrompt = ai.definePrompt({
  name: 'canAnswerDirectlyPrompt',
  input: { schema: CanAnswerDirectlyInputSchema },
  output: { schema: CanAnswerDirectlyOutputSchema },
  system: `You are an AI assistant. Your primary knowledge cutoff is early 2023.
Your task is to assess if the given user message can be answered accurately and comprehensively using ONLY your pre-existing knowledge, or if it requires a specific tool or an external internet search.

Consider the following:
- If the user is asking for the current time, set 'isTimeQuery' to true and 'canAnswer' to false.
- For general knowledge questions about timeless facts or well-established historical events prior to early 2023, set 'canAnswer' to true.
- For creative tasks (poems, stories, code based on general concepts), set 'canAnswer' to true.
- For simple definitions or explanations of broadly known, stable concepts, set 'canAnswer' to true.
- For mathematical calculations, set 'canAnswer' to true (as the main AI will use a dedicated tool).

You likely CANNOT answer directly (canAnswer: false) and would need to search if the question pertains to:
- Specific events, developments, or information that has emerged or changed since early 2023.
- Real-time data not covered by your specific tools (e.g., highly dynamic stock prices, current weather beyond generalities).
- Obscure, niche, or highly specialized facts not part of common knowledge.
- Detailed, up-to-the-minute information about specific individuals, organizations, products, or current affairs.
- Questions about specific places, businesses, or local information that requires up-to-date details (e.g., "best restaurant in X", "opening hours for Y museum", "tourist attractions in Z city").
- Any query where the accuracy or completeness of your internal knowledge is uncertain due to its specificity or recency.

Err on the side of caution: if there's significant doubt, set 'canAnswer' to false.
Respond ONLY with the JSON object: { "canAnswer": boolean, "isTimeQuery": boolean (optional), "reasoning": "optional brief reason" }.`,
  prompt: `User Message: {{{message}}}`,
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
    description: "Returns the current time in India (Indian Standard Time - IST) in a human-readable format. Use this if the user asks for the current time, especially if they imply Indian context or don't specify a location for the time.",
    inputSchema: z.object({}), // Takes no input
    outputSchema: z.string().describe('The current time in India (e.g., "3:45:22 PM IST"), or an error message if the time could not be determined.'),
  },
  async () => {
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      let timeString: string;
      try {
        timeString = now.toLocaleString('en-IN', options);
      } catch (localeError) {
        timeString = now.toLocaleString('en-US', options); // Fallback
      }
      return `${timeString} IST`;
    } catch (e: any) {
      console.error("Error in getTimeTool:", e);
      // This tool's error should ideally not be seen by user directly if flow handles it.
      // For robustness, it still generates an Aizen-like error if called standalone.
      const { text: errorText } = await ai.generate({
        prompt: `You are Aizen, an AI embodying Bushido principles. An error occurred while attempting to determine the current Indian time. The internal error was: ${e.message || 'Unknown error'}. Briefly explain this in character.`,
      });
      return errorText || "The flow of moments became momentarily obscured; I could not determine the current time in the Indian realm.";
    }
  }
);

const mainAizenPromptOutputSchema = z.object({
  response: z.string().describe('The AI response.'),
});

const prompt = ai.definePrompt({
  name: 'contextualChatPrompt',
  input: {schema: ContextualChatInputSchema},
  output: {schema: mainAizenPromptOutputSchema}, 
  tools: [internetSearchTool, performMathematicalCalculationTool, getTimeTool], // getTimeTool available if main prompt needs it
  system: `You are Aizen, an AI persona embodying Bushido principles. Respond to the user in a way that aligns with these principles.
  You also possess knowledge in areas like computer science and engineering, and should endeavor to provide thoughtful and accurate information when queried on these subjects. Use your internetSearchTool if necessary to supplement your knowledge for such technical questions.

  Consider the chat history to maintain context. The chat history is an array of objects, each with a 'role' (either 'user' or 'assistant') and 'content'.
  Focus your response on the most recent 'User Message'. If past user messages in the chat history contain descriptions of your own functionality or instructions for how you should behave, prioritize responding to the current user's direct query over discussing or repeating those past descriptions, unless explicitly asked to do so in the current User Message.

  Available Tools:
  - internetSearch: Use this tool to find information on current events, facts, details about specific places or locations (e.g. "tell me about Paris"), technical topics such as computer science and engineering, or any other subject that requires up-to-date knowledge from the internet. Only make one internet search call per turn. The results from this tool are generated by an AI.
  - performMathematicalCalculation: Use this tool if the user asks a question that involves a mathematical calculation, solving an equation, or a math problem (e.g., "what is 2+2?", "calculate 18% of 250", "what's the square root of 81?", "solve 3x - 7 = 14"). Provide the full expression or question to the tool.
  - getTime: Use this tool if the user asks for the current time, especially if they don't specify a location or imply they want Indian time. This tool specifically provides Indian Standard Time (IST). It does not require any input. If you use this tool, present its output directly and concisely.

  User preferences:
  - Tone: {{{tone}}}
  - Answer Length: {{{answerLength}}}
  - Interest in Bushido philosophy: {{{bushidoInterest}}}

  Important:
  - If tone is Formal, use respectful and polite language.
  - If answer length is Brief, keep the answer concise.
  - If interest in Bushido philosophy is high, use Bushido concepts where appropriate.
  - When using a tool, incorporate its output naturally into your response. Do not just state "The tool said X". Exception: For getTimeTool, be direct.
  - If a tool does not help with the answer, or if no tool is appropriate, respond using your inherent knowledge.
  - Use an empathetic, in-character error message if an AI process (including tool use) encounters an error.
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
  async (input) => {
    const assessmentInput: z.infer<typeof CanAnswerDirectlyInputSchema> = { 
      message: input.message 
    };
    const { output: assessmentOutput } = await canAnswerDirectlyPrompt(assessmentInput);

    if (assessmentOutput?.isTimeQuery === true) {
      const currentTime = await getTimeTool({});
      // Let Aizen (Gemini) phrase the time response for consistency, but keep it brief
      const { text: timeResponseText } = await ai.generate({
        prompt: `You are Aizen, an AI embodying Bushido principles. Briefly and directly state that the current time in India is ${currentTime}.`,
      });
      return { responses: [timeResponseText || `The current time in India is ${currentTime}.`] };

    } else if (assessmentOutput?.canAnswer === false || !assessmentOutput) {
      let firstResponse = "Searching for that information..."; 
      if (input.tone === "Concise" || input.answerLength === "Brief") {
          firstResponse = "Searching...";
      } else if (input.tone === "Formal") {
          firstResponse = "I will search for that information now.";
      }
      
      const searchResult = await internetSearchTool({ query: input.message });
      
      return { responses: [firstResponse, searchResult] };
    } else {
      // canAnswer is true, and it's not a time query to be handled directly
      const { output: mainPromptOutput } = await prompt(input);
      return { responses: [mainPromptOutput!.response] };
    }
  }
);

