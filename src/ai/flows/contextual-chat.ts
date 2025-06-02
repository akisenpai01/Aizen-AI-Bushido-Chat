
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
Your task is to assess if the given user message can be answered accurately and comprehensively using ONLY your pre-existing knowledge, OR if it's a query the main AI (Aizen, who has access to a calculator and an internet search tool) could likely handle without needing an *immediate, unguided* internet search as the very first step.

Set 'canAnswer' to true if:
- It's a general knowledge question about timeless facts or well-established historical events prior to early 2023.
- It's a creative task (poems, stories, code based on general concepts).
- It's a simple definition or explanation of broadly known, stable concepts.
- The query seems like something Aizen (with tools for math, time, and internet search) could address, even if it involves using one of those tools as part of its response generation. For example, if Aizen needs to search for 'Paris', it can decide to do so itself.

Set 'canAnswer' to false ONLY if the query is so specific and current that an immediate, direct internet lookup is the most sensible first action, and Aizen itself likely wouldn't be able to formulate a good starting response or decide to search effectively.
Set 'isTimeQuery' to true (and 'canAnswer' to false) if the user's primary intent is to ask for the current time.

Err on the side of letting Aizen (the main AI) decide if it needs to use its tools.
Respond ONLY with the JSON object: { "canAnswer": boolean, "isTimeQuery": boolean (optional), "reasoning": "optional brief reason" }.`,
  prompt: `User Message: {{{message}}}`,
});


const internetSearchTool = ai.defineTool({
  name: 'internetSearch',
  description: 'Use this tool to find information on current events, facts, details about specific places or locations (e.g. "tell me about Paris"), technical topics such as computer science and engineering, or any other subject that requires up-to-date knowledge from the internet. This tool will provide a concise answer to the query.',
  inputSchema: z.object({
    query: z.string().describe('The search query or question to find information about.'),
  }),
  outputSchema: z.string().describe('The information found, or a statement that information could not be found, or an error message if the search failed.'),
},
async (input) => {
    try {
      const { text } = await ai.generate({
        prompt: `Provide a concise and factual answer to the following query: "${input.query}"`,
      });

      if (text && text.trim()) {
        return text;
      }
      return "No information found for your query.";
    } catch (e: any) {
      console.error("Error in internetSearchTool calling Gemini:", e);
      return "Search tool encountered an error.";
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
      return "The calculation could not be completed as expected.";
    } catch (e: any) {
      console.error("Error in performMathematicalCalculationTool calling Gemini:", e);
      return "Mathematical calculation tool encountered an error.";
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
        // Fallback to en-US if en-IN is not universally supported, though it should be for time formatting.
        timeString = now.toLocaleString('en-US', options); 
      }
      return `${timeString} IST`;
    } catch (e: any) {
      console.error("Error in getTimeTool:", e);
      return "Time tool encountered an error; the current time in the Indian realm could not be determined.";
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
  tools: [internetSearchTool, performMathematicalCalculationTool, getTimeTool],
  system: `You are Aizen, an AI persona embodying Bushido principles. Respond to the user in a way that aligns with these principles.
  You also possess knowledge in areas like computer science and engineering. However, for factual accuracy, you must rely on your tools.

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
  - For any query that seeks factual information, details, current events, or specific knowledge (including technical topics), you MUST use the internetSearchTool. If you believe you know the answer, use the tool to verify or supplement your knowledge. For mathematical questions, you MUST use the performMathematicalCalculationTool. Use the getTimeTool for time queries. 
  - If a tool (like internetSearchTool or performMathematicalCalculationTool) returns a message like "No information found for your query," "Search tool encountered an error," or "Mathematical calculation tool encountered an error," you MUST clearly state this fact to the user. Do not attempt to answer the original query from your own knowledge in such cases. You may then offer to try a different search, suggest rephrasing, or acknowledge the inability to answer.
  - Respond from your inherent knowledge ONLY for simple conversational pleasantries, general advice not requiring specific data, or creative tasks explicitly asking for your unassisted generation (like a generic poem not about a specific factual theme). If in doubt, use a tool.
  - Use an empathetic, in-character error message if an AI process (including tool use) encounters an unexpected error not covered by the tool's own error messages.
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
      const { text: timeResponseText } = await ai.generate({
        prompt: `You are Aizen, an AI embodying Bushido principles. Briefly and directly state that the current time in India is ${currentTime}. If '${currentTime}' indicates an error (e.g., contains the word "error"), acknowledge the difficulty in determining the time.`,
      });
      return { responses: [timeResponseText || `The current time in India is ${currentTime}.`] };

    } else if (assessmentOutput?.canAnswer === false || !assessmentOutput) {
      let firstResponse = "Allow me a moment to consult the scrolls..."; 
      if (input.tone === "Concise" || input.answerLength === "Brief") {
          firstResponse = "Consulting scrolls...";
      } else if (input.tone === "Formal") {
          firstResponse = "I shall consult the available knowledge for that information.";
      }
      
      const searchResult = await internetSearchTool({ query: input.message });
      
      if (searchResult === "No information found for your query." || searchResult === "Search tool encountered an error.") {
         const { text: searchFailedResponse } = await ai.generate({
            prompt: `You are Aizen. The internetSearchTool returned: "${searchResult}" for the user's query: "${input.message}". Inform the user of this result in character. Do not attempt to answer the original query yourself. You can suggest they rephrase or try another path.`
         });
         return { responses: [firstResponse, searchFailedResponse || searchResult] };
      }
      return { responses: [firstResponse, searchResult] };
    } else {
      // canAnswer is true, and it's not a time query to be handled directly
      // Proceed with the main Aizen prompt which has access to all tools.
      const { output: mainPromptOutput } = await prompt(input);
      return { responses: [mainPromptOutput!.response] };
    }
  }
);

