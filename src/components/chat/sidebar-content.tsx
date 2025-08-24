
"use client";

import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { GlimpseLogo } from "../icons";
import UserList from "./user-list";
import type { ChatUser } from "./chat-layout";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import ProfileDialog from "../profile/profile-dialog";
import { cn, getInitials } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarContentProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUser: ChatUser | null;
}

export default function SidebarContent({ onSelectUser, selectedUser }: SidebarContentProps) {
  const { user, userDetails } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-2 p-4 border-b">
        <GlimpseLogo className="h-8 w-8 text-primary" />
        <span className="text-lg font-semibold">Chat App</span>
      </header>
      <div className="flex-1">
        <ScrollArea className="h-full">
            <UserList onSelectUser={onSelectUser} selectedUser={selectedUser} />
        </ScrollArea>
      </div>
      <footer className="p-4 border-t">
        <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
            {userDetails && <Avatar className={cn("h-8 w-8 ring-2 ring-offset-2 ring-offset-background")}>
                <AvatarImage src={userDetails?.photoURL || undefined} alt={userDetails?.displayName || ''} />
                <AvatarFallback className={cn("text-white")}>
                {getInitials(userDetails?.displayName || userDetails?.email || "")}
                </AvatarFallback>
            </Avatar>}
            <div className="flex flex-col truncate">
                <span className="text-sm font-medium">{userDetails?.displayName || 'You'}</span>
                <span className="text-xs text-muted-foreground truncate">
                {user?.email}
                </span>
            </div>
            </div>
            <div className="flex items-center">
                <ProfileDialog />
                <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleLogout}
                title="Logout"
                >
                <LogOut className="h-5 w-5"/>
                </Button>
            </div>
        </div>
      </footer>
    </div>
  );
}

    
