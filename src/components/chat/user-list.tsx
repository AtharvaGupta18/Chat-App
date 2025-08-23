"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { ShieldAlert, User, CheckCircle2 } from "lucide-react";
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
import { checkPhoneNumberForAbuse } from "@/ai/flows/check-phone-number";
import type { ChatUser } from "./chat-layout";
import { Badge } from "@/components/ui/badge";

interface UserListProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUser: ChatUser | null;
}

export default function UserList({ onSelectUser, selectedUser }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [abuseStatus, setAbuseStatus] = useState<Record<string, boolean | 'checking'>>({});

  useEffect(() => {
    const q = query(collection(firestore, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: ChatUser[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUser?.uid) {
          const data = doc.data();
          usersData.push({
            uid: doc.id,
            phoneNumber: data.phoneNumber,
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
      const phoneA = a.phoneNumber || '';
      const phoneB = b.phoneNumber || '';
      return phoneA.localeCompare(phoneB);
    });
  }, [users]);

  useEffect(() => {
    users.forEach(user => {
      if (user.phoneNumber && !(user.uid in abuseStatus)) {
        setAbuseStatus(prev => ({ ...prev, [user.uid]: 'checking' }));
        checkPhoneNumberForAbuse({ phoneNumber: user.phoneNumber })
          .then(result => {
            setAbuseStatus(prev => ({ ...prev, [user.uid]: result.isAbusive }));
          })
          .catch(() => {
            setAbuseStatus(prev => ({ ...prev, [user.uid]: false }));
          });
      }
    });
  }, [users, abuseStatus]);

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
                tooltip={user.phoneNumber || 'Unknown user'}
              >
                <User />
                <span className="truncate">{user.phoneNumber}</span>
                {abuseStatus[user.uid] === 'checking' && <Badge variant="secondary" className="ml-auto">Checking...</Badge>}
                {abuseStatus[user.uid] === true && <Badge variant="destructive" className="ml-auto"><ShieldAlert className="w-3 h-3 mr-1"/>Abusive</Badge>}
                {abuseStatus[user.uid] === false && <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/>Verified</Badge>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}
