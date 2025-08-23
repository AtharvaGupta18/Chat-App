'use server';

/**
 * @fileOverview A flow to suggest usernames.
 *
 * - suggestUsernames - A function that suggests usernames based on a given name.
 * - SuggestUsernamesInput - The input type for the suggestUsernames function.
 * - SuggestUsernamesOutput - The return type for the suggestUsernames function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {firestore} from '@/lib/firebase';
import {collection, getDocs, query, where} from 'firebase/firestore';

const SuggestUsernamesInputSchema = z.object({
  name: z.string().describe('The full name of the user.'),
});
export type SuggestUsernamesInput = z.infer<
  typeof SuggestUsernamesInputSchema
>;

const SuggestUsernamesOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of suggested usernames.'),
});
export type SuggestUsernamesOutput = z.infer<
  typeof SuggestUsernamesOutputSchema
>;

export async function suggestUsernames(
  input: SuggestUsernamesInput
): Promise<SuggestUsernamesOutput> {
  return suggestUsernamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestUsernamesPrompt',
  input: {schema: SuggestUsernamesInputSchema},
  output: {schema: SuggestUsernamesOutputSchema},
  prompt: `You are an expert in creating unique and catchy usernames.
    Based on the user's full name, "{{name}}", generate a list of 5 creative and memorable username suggestions.
    The usernames should be a single word, lowercase, and can contain letters, numbers, and underscores.
    Do not include any special characters other than underscores.
    Return the suggestions in the "suggestions" array.
  `,
});

const suggestUsernamesFlow = ai.defineFlow(
  {
    name: 'suggestUsernamesFlow',
    inputSchema: SuggestUsernamesInputSchema,
    outputSchema: SuggestUsernamesOutputSchema,
  },
  async input => {
    let suggestions: string[] = [];
    let attempts = 0;
    const maxAttempts = 5;

    while (suggestions.length < 5 && attempts < maxAttempts) {
      const {output} = await prompt(input);
      const candidates = output?.suggestions || [];

      if (candidates.length > 0) {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('username', 'in', candidates));
        const querySnapshot = await getDocs(q);
        const existingUsernames = new Set(
          querySnapshot.docs.map(doc => doc.data().username)
        );

        const newSuggestions = candidates.filter(
          username => !existingUsernames.has(username)
        );
        suggestions = [...new Set([...suggestions, ...newSuggestions])];
      }
      attempts++;
    }

    return {suggestions: suggestions.slice(0, 5)};
  }
);
