"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import SidebarContent from "./sidebar-content";
import ChatWindow from "./chat-window";
import { WhisperLinkLogo } from "../icons";
import { Button } from "../ui/button";

export interface ChatUser {
  uid: string;
  email: string | null;
}

export default function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUser(user);
  };

  return (
    <div className="h-screen w-full bg-background">
      <SidebarProvider>
        <Sidebar>
          <SidebarContent onSelectUser={handleSelectUser} selectedUser={selectedUser}/>
        </Sidebar>
        <SidebarRail />
        <SidebarInset>
          {selectedUser ? (
            <ChatWindow recipient={selectedUser} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <WhisperLinkLogo className="h-24 w-24 text-primary" />
              <h2 className="text-2xl font-bold">Welcome to WhisperLink</h2>
              <p className="text-muted-foreground">
                Select a user from the sidebar to start a conversation.
              </p>
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
