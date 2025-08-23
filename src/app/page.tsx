"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers";
import AuthLayout from "@/components/auth/auth-layout";
import ChatLayout from "@/components/chat/chat-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { WhisperLinkLogo } from "@/components/icons";
import type { ChatUser } from "@/components/chat/chat-layout";
import ChatWindow from "@/components/chat/chat-window";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUser(user);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

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

  if (!user) {
    return <AuthLayout />;
  }

  if (selectedUser) {
    return (
      <div className="flex h-screen w-screen flex-col">
        <ChatWindow recipient={selectedUser} onBack={handleBack} />
      </div>
    );
  }

  return <ChatLayout onSelectUser={handleSelectUser} selectedUser={selectedUser} />;
}
