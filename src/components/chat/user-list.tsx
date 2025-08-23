
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { User, RefreshCw, Search } from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/components/providers";
import type { ChatUser } from "./chat-layout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "../ui/input";

interface UserListProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUser: ChatUser | null;
}

export default function UserList({ onSelectUser, selectedUser }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const q = query(collection(firestore, "users"), where("uid", "!=", currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: ChatUser[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push(doc.data() as ChatUser);
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error on snapshot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch real-time user updates.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      const nameA = a.displayName || a.email || '';
      const nameB = b.displayName || b.email || '';
      return nameA.localeCompare(nameB);
    });
  }, [users, searchQuery]);

  if (loading) {
    return (
      <SidebarContent>
        <SidebarGroup>
           <SidebarGroupLabel>All Users</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuSkeleton showIcon />
            <SidebarMenuSkeleton showIcon />
            <SidebarMenuSkeleton showIcon />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    );
  }

  return (
    <SidebarContent>
      <SidebarGroup>
        <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
            />
        </div>
        <SidebarGroupLabel>All Users</SidebarGroupLabel>
        <SidebarMenu>
          {filteredUsers.map((user) => (
            <SidebarMenuItem key={user.uid}>
              <SidebarMenuButton
                onClick={() => onSelectUser(user)}
                isActive={selectedUser?.uid === user.uid}
                className="w-full justify-start"
                tooltip={user.displayName || user.email || 'Unknown user'}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="truncate font-medium">{user.displayName || user.email}</span>
                  <span className="truncate text-xs text-muted-foreground">@{user.username}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}
