
"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { User, Search } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "../ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, generateAvatarColor, getInitials } from "@/lib/utils";

interface UserListProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUser: ChatUser | null;
}

interface ChatData {
  id: string;
  unreadCount: { [key: string]: number };
  users: string[];
}

export default function UserList({ onSelectUser, selectedUser }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<ChatData[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const usersQuery = query(collection(firestore, "users"), where("uid", "!=", currentUser.uid));
    const usersUnsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
      const usersData: ChatUser[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push(doc.data() as ChatUser);
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch real-time user updates.",
      });
      setLoading(false);
    });

    const chatsQuery = query(collection(firestore, "chats"), where("users", "array-contains", currentUser.uid));
    const chatsUnsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const chatsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatData));
        setChats(chatsData);
    });

    return () => {
        usersUnsubscribe();
        chatsUnsubscribe();
    };
  }, [currentUser, toast]);

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

  const getUnreadCountForUser = (otherUserUid: string) => {
    if (!currentUser) return 0;
    const chatId = [currentUser.uid, otherUserUid].sort().join("_");
    const chat = chats.find(c => c.id === chatId);
    return chat?.unreadCount?.[currentUser.uid] || 0;
  };


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
          {filteredUsers.map((user) => {
            const unreadCount = getUnreadCountForUser(user.uid);
            const userAvatarColors = generateAvatarColor(user.uid);
            return (
            <SidebarMenuItem key={user.uid}>
              <SidebarMenuButton
                onClick={() => onSelectUser(user)}
                isActive={selectedUser?.uid === user.uid}
                className="w-full justify-start relative"
                tooltip={user.displayName || user.email || 'Unknown user'}
              >
                <Avatar className={cn("h-6 w-6 ring-2 ring-offset-2 ring-offset-background", userAvatarColors.ring)}>
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                  <AvatarFallback className={cn("text-white", userAvatarColors.bg)}>
                    {getInitials(user.displayName || user.email || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="truncate font-medium">{user.displayName || user.email}</span>
                  <span className="truncate text-xs text-muted-foreground">@{user.username}</span>
                </div>
                {unreadCount > 0 && (
                    <Badge className="absolute right-2 top-1/2 -translate-y-1/2 h-5 min-w-[1.25rem] px-1.5 text-xs">
                        {unreadCount}
                    </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )})}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}
