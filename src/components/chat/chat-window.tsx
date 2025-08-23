
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
  writeBatch,
  increment,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { SendHorizonal, User as UserIcon, Check, CheckCheck } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/components/providers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  status: 'sent' | 'delivered' | 'read';
}

export default function ChatWindow({ recipient }: ChatWindowProps) {
  const { user: currentUser, userDetails } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);

  const chatId =
    currentUser && recipient
      ? [currentUser.uid, recipient.uid].sort().join("_")
      : null;

  useEffect(() => {
    if (!chatId || !currentUser) return;

    const markMessagesAsRead = async () => {
        const messagesRef = collection(firestore, "chats", chatId, "messages");
        const q = query(messagesRef, where("senderId", "==", recipient.uid));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(firestore);
        querySnapshot.forEach(doc => {
            if (doc.data().status !== 'read') {
                batch.update(doc.ref, { status: "read" });
            }
        });
        await batch.commit();
    };

    const resetUnreadCount = async () => {
      const chatDocRef = doc(firestore, "chats", chatId);
      const chatDoc = await getDoc(chatDocRef);
      if (chatDoc.exists()) {
        await updateDoc(chatDocRef, {
          [`unreadCount.${currentUser.uid}`]: 0,
        });
      }
    };
    
    resetUnreadCount();
    markMessagesAsRead();

    setLoading(true);
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
       resetUnreadCount();
       markMessagesAsRead();
    }, (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, currentUser, recipient]);

  useEffect(() => {
    if (viewportRef.current) {
        setTimeout(() => {
             if (viewportRef.current) {
                viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
             }
        }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !currentUser) return;

    const messageText = newMessage;
    setNewMessage("");

    const chatDocRef = doc(firestore, "chats", chatId);
    const messagesColRef = collection(chatDocRef, "messages");

    try {
        const chatDoc = await getDoc(chatDocRef);
        const batch = writeBatch(firestore);

        if(!chatDoc.exists()){
            batch.set(chatDocRef, {
                users: [currentUser.uid, recipient.uid],
                userEmails: [currentUser.email, recipient.email],
                createdAt: serverTimestamp(),
                lastMessage: messageText,
                lastMessageTimestamp: serverTimestamp(),
                unreadCount: {
                  [currentUser.uid]: 0,
                  [recipient.uid]: 1,
                }
            });
        } else {
            batch.update(chatDocRef, {
                lastMessage: messageText,
                lastMessageTimestamp: serverTimestamp(),
                [`unreadCount.${recipient.uid}`]: increment(1),
            });
        }
     
      const newMessageRef = doc(messagesColRef);
      batch.set(newMessageRef, {
        text: messageText,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'delivered',
      });
      
      await batch.commit();

    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const MessageStatus = ({ status }: { status: Message['status'] }) => {
    if (status === 'read') {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    if (status === 'delivered') {
      return <CheckCheck className="h-4 w-4 text-primary-foreground/70" />;
    }
    return <Check className="h-4 w-4 text-primary-foreground/70" />;
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
          <AvatarImage src={recipient.photoURL || undefined} alt={recipient.displayName || ''}/>
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{recipient.displayName || recipient.email}</h2>
        </div>
      </header>

      <ScrollArea className="flex-1" viewportRef={viewportRef}>
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
                    <AvatarImage src={recipient.photoURL || undefined} alt={recipient.displayName || ''}/>
                    <AvatarFallback>
                        <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
                )}
                <div
                className={cn(
                    "max-w-xs rounded-lg px-4 py-2 md:max-w-md lg:max-w-lg flex items-end gap-2",
                    message.senderId === currentUser?.uid
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
                >
                  <p className="text-sm break-words">{message.text}</p>
                   {message.senderId === currentUser?.uid && (
                      <MessageStatus status={message.status} />
                   )}
                </div>
                 {message.senderId === currentUser?.uid && (
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={userDetails?.photoURL || undefined} alt={userDetails?.displayName || ''}/>
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
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
