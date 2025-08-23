"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { SendHorizonal, User as UserIcon } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/components/providers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatUser } from "./chat-layout";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWindowProps {
  recipient: ChatUser;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
}

export default function ChatWindow({ recipient }: ChatWindowProps) {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const chatId =
    currentUser && recipient
      ? [currentUser.uid, recipient.uid].sort().join("_")
      : null;

  useEffect(() => {
    if (!chatId) return;

    const messagesQuery = query(
      collection(firestore, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Message));
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (viewportRef.current) {
        setTimeout(() => {
             if (viewportRef.current) {
                viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
             }
        }, 100);
    }
  }, [messages, recipient]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !currentUser) return;

    const messageText = newMessage;
    setNewMessage("");

    const chatDocRef = doc(firestore, "chats", chatId);
    const messagesColRef = collection(chatDocRef, "messages");

    try {
        const chatDoc = await getDoc(chatDocRef);
        if(!chatDoc.exists()){
             await setDoc(chatDocRef, {
                users: [currentUser.uid, recipient.uid],
                createdAt: serverTimestamp(),
                lastMessage: messageText,
                lastMessageTimestamp: serverTimestamp(),
            });
        } else {
             await setDoc(chatDocRef, {
                lastMessage: messageText,
                lastMessageTimestamp: serverTimestamp(),
            }, { merge: true });
        }
     
      await addDoc(messagesColRef, {
        text: messageText,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="ml-auto h-10 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-4 border-b p-4 shadow-sm">
        <Avatar>
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{recipient.phoneNumber}</h2>
          <p className="text-xs text-muted-foreground">
            {recipient.isAbusive ? "This user might be abusive" : "Online"}
          </p>
        </div>
      </header>

      <ScrollArea className="flex-1" ref={scrollAreaRef} viewportRef={viewportRef}>
        <div className="p-4 space-y-4">
            {messages.map((message) => (
            <div
                key={message.id}
                className={cn(
                "flex items-end gap-2",
                message.senderId === currentUser?.uid ? "justify-end" : "justify-start"
                )}
            >
                {message.senderId !== currentUser?.uid && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback>
                    <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
                )}
                <div
                className={cn(
                    "max-w-xs rounded-lg px-4 py-2 md:max-w-md lg:max-w-lg",
                    message.senderId === currentUser?.uid
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
                >
                <p className="text-sm">{message.text}</p>
                </div>
            </div>
            ))}
        </div>
      </ScrollArea>

      <footer className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <SendHorizonal className="h-5 w-5" />
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
