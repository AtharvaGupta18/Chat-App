
"use client";

import SidebarContent from "./sidebar-content";

export interface ChatUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
    username?: string | null;
    bio?: string | null;
    fcmToken?: string | null;
}

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
