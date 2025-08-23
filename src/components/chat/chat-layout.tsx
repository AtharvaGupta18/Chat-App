
"use client";

import SidebarContent from "./sidebar-content";
import type { ChatUser } from "./chat-layout";

export interface ChatLayoutProps {
    onSelectUser: (user: ChatUser) => void;
    selectedUser: ChatUser | null;
}

export default function ChatLayout({ onSelectUser, selectedUser }: ChatLayoutProps) {
  return (
    <div className="h-screen w-full bg-background">
        <SidebarContent onSelectUser={onSelectUser} selectedUser={selectedUser} />
    </div>
  );
}
