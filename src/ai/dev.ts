import { config } from 'dotenv';
config();

import '@/ai/flows/contextual-chat.ts';
import '@/ai/flows/generate-haiku.ts';
import '@/ai/flows/generate-error-message.ts';