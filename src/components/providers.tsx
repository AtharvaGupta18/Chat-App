
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";
import { Toaster } from "@/components/ui/toaster";
import type { ChatUser } from "@/components/chat/chat-layout";

interface AuthContextType {
  user: User | null;
  userDetails: ChatUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDetails: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, "users", user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserDetails(doc.data() as ChatUser);
        }
      });
      return () => unsubscribe();
    } else {
      setUserDetails(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userDetails, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
