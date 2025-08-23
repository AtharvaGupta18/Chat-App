"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers";
import AuthLayout from "@/components/auth/auth-layout";
import ChatLayout from "@/components/chat/chat-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { GlimpseLogo } from "@/components/icons";
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
      <main className="flex h-screen w-full items-center justify-center bg-background overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <GlimpseLogo className="h-16 w-16 text-primary" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return <AuthLayout />;
  }

  if (selectedUser) {
    return (
      <main className="h-screen w-full flex flex-col overflow-hidden">
        <ChatWindow recipient={selectedUser} onBack={handleBack} />
      </main>
    );
  }

  return (
    <main className="h-screen w-full overflow-hidden">
      <ChatLayout onSelectUser={handleSelectUser} selectedUser={selectedUser} />
    </main>
  );
}
