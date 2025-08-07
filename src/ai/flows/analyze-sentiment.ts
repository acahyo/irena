'use server';

/**
 * @fileOverview An AI agent for analyzing the sentiment of employee feedback and HR reports.
 *
 * - analyzeSentiment - A function that analyzes the sentiment of the given text.
 * - AnalyzeSentimentInput - The input type for the analyzeSentiment function.
 * - AnalyzeSentimentOutput - The return type for the analyzeSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSentimentInputSchema = z.object({
  text: z
    .string()
    .describe('The text to analyze, such as employee feedback or HR reports.'),
});
export type AnalyzeSentimentInput = z.infer<typeof AnalyzeSentimentInputSchema>;

const AnalyzeSentimentOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The sentiment of the text, such as positive, negative, or neutral.'
    ),
  score: z
    .number()
    .describe(
      'A numerical score representing the sentiment, ranging from -1 (negative) to 1 (positive).'
    ),
  flagForAction:
    z.boolean().describe('Whether the sentiment is negative enough to warrant action.'),
  reason: z.string().optional().describe('Explanation of the sentiment analysis result.'),
});
export type AnalyzeSentimentOutput = z.infer<typeof AnalyzeSentimentOutputSchema>;

export async function analyzeSentiment(input: AnalyzeSentimentInput): Promise<AnalyzeSentimentOutput> {
  return analyzeSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentimentPrompt',
  input: {schema: AnalyzeSentimentInputSchema},
  output: {schema: AnalyzeSentimentOutputSchema},
  prompt: `You are an AI sentiment analyzer specializing in employee feedback and HR reports.

  Analyze the sentiment of the following text and provide a sentiment score between -1 and 1, where -1 is very negative and 1 is very positive.

  Based on the sentiment and score, determine if the feedback should be flagged for action.  If the sentiment is sufficiently negative and the score is sufficiently low, set the flagForAction field to true.

  Explain the reason for your analysis in the reason field.

  Text: {{{text}}}`,
});

const analyzeSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeSentimentFlow',
    inputSchema: AnalyzeSentimentInputSchema,
    outputSchema: AnalyzeSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
