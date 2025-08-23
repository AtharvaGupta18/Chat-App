'use server';

/**
 * @fileOverview Flow to check if a phone number is associated with abuse.
 *
 * - checkPhoneNumberForAbuse - Function to check a phone number for abuse.
 * - CheckPhoneNumberForAbuseInput - Input type for the checkPhoneNumberForAbuse function.
 * - CheckPhoneNumberForAbuseOutput - Return type for the checkPhoneNumberForAbuse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckPhoneNumberForAbuseInputSchema = z.object({
  phoneNumber: z
    .string()
    .describe('The phone number to check for potential abuse.'),
});
export type CheckPhoneNumberForAbuseInput = z.infer<
  typeof CheckPhoneNumberForAbuseInputSchema
>;

const CheckPhoneNumberForAbuseOutputSchema = z.object({
  isAbusive: z
    .boolean()
    .describe(
      'Whether the phone number is likely associated with abusive activity.'
    ),
  reason: z
    .string()
    .optional()
    .describe('The reason why the phone number is considered abusive.'),
});
export type CheckPhoneNumberForAbuseOutput = z.infer<
  typeof CheckPhoneNumberForAbuseOutputSchema
>;

export async function checkPhoneNumberForAbuse(
  input: CheckPhoneNumberForAbuseInput
): Promise<CheckPhoneNumberForAbuseOutput> {
  return checkPhoneNumberForAbuseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkPhoneNumberForAbusePrompt',
  input: {schema: CheckPhoneNumberForAbuseInputSchema},
  output: {schema: CheckPhoneNumberForAbuseOutputSchema},
  prompt: `You are an AI assistant designed to detect phone numbers associated with spam, fraud, or other abusive activities.

  Analyze the provided phone number and determine if it exhibits characteristics commonly associated with malicious behavior.

  Consider factors such as:
  - Presence on known spam lists or abuse databases.
  - Use of temporary or disposable phone number services.
  - History of suspicious activity or violations.

  Based on your analysis, set the isAbusive output field to true if there is a high likelihood of abuse, and provide a brief explanation in the reason field. Otherwise, set isAbusive to false.

  Phone Number: {{{phoneNumber}}}`,
});

const checkPhoneNumberForAbuseFlow = ai.defineFlow(
  {
    name: 'checkPhoneNumberForAbuseFlow',
    inputSchema: CheckPhoneNumberForAbuseInputSchema,
    outputSchema: CheckPhoneNumberForAbuseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
