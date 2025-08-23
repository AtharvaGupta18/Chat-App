"use client";

import { useState } from "react";
import EmailPasswordLogin from "./email-password-login";
import { WhisperLinkLogo } from "../icons";
import { useAuth } from "../providers";
import ChatLayout from "../chat/chat-layout";
import { Button } from "../ui/button";

export default function AuthLayout() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (user && !user.isAnonymous && !showLogin) {
    return <ChatLayout />;
  }

  if (showLogin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <EmailPasswordLogin />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="flex flex-col items-center gap-6">
        <WhisperLinkLogo className="h-24 w-24 text-primary" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Welcome to WhisperLink</h1>
          <p className="text-muted-foreground">
            A secure, real-time one-to-one chat application.
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setShowLogin(true)}>Get Started</Button>
        </div>
        {user?.isAnonymous && (
           <Button variant="link" onClick={() => window.location.reload()}>Continue as Guest</Button>
        )}
      </div>
    </main>
  );
}
