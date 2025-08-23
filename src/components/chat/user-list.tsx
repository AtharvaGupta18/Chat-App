
"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
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
import { formatDistanceToNow } from 'date-fns';

interface UserListProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUser: ChatUser | null;
}

interface ChatData {
  id: string;
  unreadCount: { [key: string]: number };
  users: string[];
  lastMessage?: string;
  lastMessageTimestamp?: {
    seconds: number;
    nanoseconds: number;
  };
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

    const chatsQuery = query(
        collection(firestore, "chats"), 
        where("users", "array-contains", currentUser.uid),
        orderBy("lastMessageTimestamp", "desc")
    );
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

  const getChatDataForUser = (otherUserUid: string) => {
    if (!currentUser) return null;
    const chatId = [currentUser.uid, otherUserUid].sort().join("_");
    return chats.find(c => c.id === chatId) || null;
  };

  const filteredAndSortedUsers = useMemo(() => {
    return users.filter(user => 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      const chatA = getChatDataForUser(a.uid);
      const chatB = getChatDataForUser(b.uid);

      const timeA = chatA?.lastMessageTimestamp?.seconds || 0;
      const timeB = chatB?.lastMessageTimestamp?.seconds || 0;

      if (timeA !== timeB) {
        return timeB - timeA;
      }
      
      const nameA = a.displayName || a.email || '';
      const nameB = b.displayName || b.email || '';
      return nameA.localeCompare(nameB);
    });
  }, [users, searchQuery, chats]);

  const getUnreadCountForUser = (chat: ChatData | null) => {
    if (!currentUser || !chat) return 0;
    return chat.unreadCount?.[currentUser.uid] || 0;
  };


  if (loading) {
    return (
       <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
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
          {filteredAndSortedUsers.map((user, index) => {
            const chatData = getChatDataForUser(user.uid);
            const unreadCount = getUnreadCountForUser(chatData);
            const userAvatarColors = generateAvatarColor(user.uid);
            const lastMessageTimestamp = chatData?.lastMessageTimestamp;
            const timeAgo = lastMessageTimestamp ? formatDistanceToNow(new Date(lastMessageTimestamp.seconds * 1000), { addSuffix: true }) : '';

            return (
            <Fragment key={user.uid}>
              <Button
                  variant={selectedUser?.uid === user.uid ? "secondary" : "ghost"}
                  onClick={() => onSelectUser(user)}
                  className="w-full h-auto justify-start p-2"
                >
                  <div className="flex items-center gap-4 w-full">
                      <Avatar className={cn("h-12 w-12 ring-2 ring-offset-2 ring-offset-background", userAvatarColors.ring)}>
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                      <AvatarFallback className={cn("text-white text-xl", userAvatarColors.bg)}>
                          {getInitials(user.displayName || user.email || "")}
                      </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start truncate flex-1">
                        <div className="flex justify-between w-full">
                            <span className="truncate font-medium">{user.displayName || user.email}</span>
                            {timeAgo && <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{timeAgo}</span>}
                        </div>
                        <div className="flex items-center justify-between w-full">
                            <span className="truncate text-sm text-muted-foreground pr-4">
                                {chatData?.lastMessage || `Start a conversation with @${user.username}`}
                            </span>
                            {unreadCount > 0 && (
                                <Badge className="h-6 min-w-[1.5rem] text-sm flex-shrink-0">
                                    {unreadCount}
                                </Badge>
                            )}
                        </div>
                      </div>
                  </div>
                </Button>
                {index < filteredAndSortedUsers.length - 1 && (
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-muted/20 to-transparent" />
                )}
            </Fragment>
          )})}
        </div>
      </div>
  );
}

