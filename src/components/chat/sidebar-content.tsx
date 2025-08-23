"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/providers";
import {
  SidebarContent as SC,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { WhisperLinkLogo } from "../icons";
import UserList from "./user-list";
import type { ChatUser } from "./chat-layout";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface SidebarContentProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUser: ChatUser | null;
}

export default function SidebarContent({ onSelectUser, selectedUser }: SidebarContentProps) {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <SC className="flex flex-col">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <WhisperLinkLogo className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold">WhisperLink</span>
        </div>
      </SidebarHeader>
      <UserList onSelectUser={onSelectUser} selectedUser={selectedUser} />
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <UserIcon />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium">You</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user?.email || "Anonymous User"}
                  </span>
                </div>
              </div>
              <SidebarMenuButton
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleLogout}
                tooltip="Logout"
              >
                <LogOut />
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SC>
  );
}
