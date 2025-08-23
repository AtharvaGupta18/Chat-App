
'use server';
/**
 * @fileOverview A flow for sending push notifications via FCM.
 *
 * - sendNotification - A function that sends a notification to a specific device.
 * - SendNotificationInput - The input type for the sendNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if it hasn't been already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const SendNotificationInputSchema = z.object({
  token: z.string().describe('The FCM registration token of the target device.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body of the notification.'),
});
export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

export async function sendNotification(input: SendNotificationInput): Promise<void> {
  await sendNotificationFlow(input);
}

const sendNotificationFlow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { token, title, body } = input;

    if (!token) {
        console.log("No FCM token provided, skipping notification.");
        return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      token: token,
    };

    try {
      await admin.messaging().send(message);
      console.log('Successfully sent message to token:', token);
    } catch (error) {
      console.error('Error sending message:', error);
      // It's common for tokens to become invalid. You might want to
      // handle certain errors by removing the token from your database.
    }
  }
);
