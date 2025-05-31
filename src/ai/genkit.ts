
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // NOTE: User needs to verify 'googleai/gemini-2.5-pro' is the correct
  // and available model identifier for Gemini 2.5 Pro with the googleAI plugin.
  // Refer to official Google AI / Genkit documentation.
  model: 'googleai/gemini-2.5-pro',
});
