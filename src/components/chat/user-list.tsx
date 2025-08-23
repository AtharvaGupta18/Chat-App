"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { User } from "lucide-react";
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

interface UserListProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUser: ChatUser | null;
}

export default function UserList({ onSelectUser, selectedUser }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: ChatUser[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUser?.uid) {
          const data = doc.data();
          usersData.push({
            uid: doc.id,
            email: data.email,
          });
        }
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const emailA = a.email || '';
      const emailB = b.email || '';
      return emailA.localeCompare(emailB);
    });
  }, [users]);

  if (loading) {
    return (
      <SidebarContent>
        <SidebarGroup>
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
