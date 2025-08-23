"use client";

import EmailPasswordLogin from "./email-password-login";
import { WhisperLinkLogo } from "../icons";

export default function AuthLayout() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <WhisperLinkLogo className="h-24 w-24 text-primary" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Welcome to WhisperLink</h1>
          <p className="text-muted-foreground">
            A secure, real-time one-to-one chat application.
          </p>
        </div>
        <EmailPasswordLogin />
      </div>
    </main>
  );
}
