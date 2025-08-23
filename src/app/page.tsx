"use client";

import { useAuth } from "@/components/providers";
import AuthLayout from "@/components/auth/auth-layout";
import ChatLayout from "@/components/chat/chat-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { WhisperLinkLogo } from "@/components/icons";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <WhisperLinkLogo className="h-16 w-16 text-primary" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return <AuthLayout />;
  }

  return <ChatLayout />;
}
