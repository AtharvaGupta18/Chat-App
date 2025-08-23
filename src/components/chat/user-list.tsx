
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { User, RefreshCw } from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarGroupAction,
} from "@/components/ui/sidebar";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/components/providers";
import type { ChatUser } from "./chat-layout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UserListProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUser: ChatUser | null;
}

export default function UserList({ onSelectUser, selectedUser }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    setReloading(true);
    try {
      const q = query(collection(firestore, "users"), where("uid", "!=", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const usersData: ChatUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email) {
          usersData.push({
            uid: data.uid,
            email: data.email,
          });
        }
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch users.",
      });
    } finally {
      setReloading(false);
    }
  }, [currentUser, toast]);


  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const q = query(collection(firestore, "users"), where("uid", "!=", currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: ChatUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if(data.email) { // only show users with emails
             usersData.push({
                uid: data.uid,
                email: data.email,
            });
        }
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
  }, [currentUser, toast]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const emailA = a.email || '';
      const emailB = b.email || '';
      return emailA.localeCompare(emailB);
    });
  }, [users]);
  
  const handleReload = () => {
    fetchUsers();
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
        <SidebarGroupLabel>All Users</SidebarGroupLabel>
        <SidebarGroupAction onClick={handleReload} disabled={reloading} tooltip="Refresh Users">
            <RefreshCw className={cn(reloading && "animate-spin")} />
        </SidebarGroupAction>
        <SidebarMenu>
          {sortedUsers.map((user) => (
            <SidebarMenuItem key={user.uid}>
              <SidebarMenuButton
                onClick={() => onSelectUser(user)}
                isActive={selectedUser?.uid === user.uid}
                className="w-full justify-start"
                tooltip={user.email || 'Unknown user'}
              >
                <User />
                <span className="truncate">{user.email}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}
