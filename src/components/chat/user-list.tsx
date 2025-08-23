
"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/components/providers";
import type { ChatUser } from "./chat-layout";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "../ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, generateAvatarColor, getInitials } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";

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
       <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
            />
        </div>
        <div className="space-y-2">
          {filteredUsers.map((user) => {
            const unreadCount = getUnreadCountForUser(user.uid);
            const userAvatarColors = generateAvatarColor(user.uid);
            return (
            <Button
                key={user.uid}
                variant={selectedUser?.uid === user.uid ? "secondary" : "ghost"}
                onClick={() => onSelectUser(user)}
                className="w-full h-auto justify-start p-2 relative"
              >
                <div className="flex items-center gap-4">
                    <Avatar className={cn("h-12 w-12 ring-2 ring-offset-2 ring-offset-background", userAvatarColors.ring)}>
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                    <AvatarFallback className={cn("text-white text-xl", userAvatarColors.bg)}>
                        {getInitials(user.displayName || user.email || "")}
                    </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start truncate">
                    <span className="truncate font-medium">{user.displayName || user.email}</span>
                    <span className="truncate text-sm text-muted-foreground">@{user.username}</span>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Badge className="absolute right-2 top-1/2 -translate-y-1/2 h-6 min-w-[1.5rem] text-sm">
                        {unreadCount}
                    </Badge>
                )}
              </Button>
          )})}
        </div>
      </div>
  );
}
