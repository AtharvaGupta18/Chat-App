
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
import { SendHorizonal, User as UserIcon, Check, CheckCheck, ArrowLeft } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/components/providers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatUser } from "./chat-layout";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getInitials, generateAvatarColor } from "@/lib/utils";
import { sendNotification } from "@/ai/flows/send-notification-flow";

interface ChatWindowProps {
  recipient: ChatUser;
  onBack: () => void;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  status: 'sent' | 'delivered' | 'read';
}

export default function ChatWindow({ recipient, onBack }: ChatWindowProps) {
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

    const resetUnreadCount = async () => {
      if (!currentUser?.uid || !chatId) return;
      const chatDocRef = doc(firestore, "chats", chatId);
      const chatDoc = await getDoc(chatDocRef);
      if (chatDoc.exists()) {
        await updateDoc(chatDocRef, {
          [`unreadCount.${currentUser.uid}`]: 0,
        });
      }
    };
    
    resetUnreadCount();

    setLoading(true);
    const messagesQuery = query(
      collection(firestore, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const newMessages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Message));
      setMessages(newMessages);
      setLoading(false);

      // Mark incoming messages as read
      const batch = writeBatch(firestore);
      let hasUnreadMessages = false;
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
            const messageDoc = change.doc;
            const message = messageDoc.data() as Message;
            if (message.senderId === recipient.uid && message.status !== 'read') {
                batch.update(messageDoc.ref, { status: 'read' });
                hasUnreadMessages = true;
            }
        }
      });


      if (hasUnreadMessages) {
          try {
              await batch.commit();
          } catch (error) {
              console.error("Error marking messages as read", error);
          }
      }
       
      resetUnreadCount();
    }, (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, currentUser, recipient.uid]);

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
    if (!newMessage.trim() || !chatId || !currentUser || !userDetails) return;

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

      if (recipient.fcmToken) {
          await sendNotification({
              title: userDetails.displayName || userDetails.username || 'New Message',
              body: messageText,
              token: recipient.fcmToken
          });
      }


    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const MessageStatus = ({ status }: { status: Message['status'] }) => {
    if (status === 'read') {
      return <CheckCheck className="h-4 w-4 text-blue-400" />;
    }
    if (status === 'delivered') {
      return <CheckCheck className="h-4 w-4 text-primary-foreground/70" />;
    }
    return <Check className="h-4 w-4 text-primary-foreground/70" />;
  };
  
  const recipientAvatarColors = recipient ? generateAvatarColor(recipient.uid) : {};
  const currentUserAvatarColors = userDetails ? generateAvatarColor(userDetails.uid) : {};

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
        <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft />
        </Button>
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex items-center gap-4 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors flex-1">
                    <Avatar className={cn('ring-2 ring-offset-2 ring-offset-background', recipientAvatarColors.ring)}>
                    <AvatarImage src={recipient.photoURL || undefined} alt={recipient.displayName || ''}/>
                    <AvatarFallback className={cn("text-white", recipientAvatarColors.bg)}>
                        {getInitials(recipient.displayName || recipient.email || "")}
                    </AvatarFallback>
                    </Avatar>
                    <div>
                    <h2 className="font-semibold">{recipient.displayName || recipient.email}</h2>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <div className="flex flex-col items-center text-center gap-4">
                        <Avatar className={cn('h-24 w-24 ring-2 ring-offset-2 ring-offset-background', recipientAvatarColors.ring)}>
                            <AvatarImage src={recipient.photoURL || undefined} alt={recipient.displayName || ''}/>
                            <AvatarFallback className={cn("text-4xl text-white", recipientAvatarColors.bg)}>
                            {getInitials(recipient.displayName || recipient.email || "")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl">{recipient.displayName}</DialogTitle>
                            <DialogDescription>@{recipient.username}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                {recipient.bio && (
                    <div className="text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                        {recipient.bio}
                    </div>
                )}
            </DialogContent>
        </Dialog>
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
                <Avatar className={cn('h-8 w-8 ring-2 ring-offset-2 ring-offset-background', recipientAvatarColors.ring)}>
                    <AvatarImage src={recipient.photoURL || undefined} alt={recipient.displayName || ''}/>
                    <AvatarFallback className={cn("text-white", recipientAvatarColors.bg)}>
                        {getInitials(recipient.displayName || recipient.email || "")}
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
                 {message.senderId === currentUser?.uid && userDetails && (
                  <Avatar className={cn('h-8 w-8 ring-2 ring-offset-2 ring-offset-background', currentUserAvatarColors.ring)}>
                     <AvatarImage src={userDetails?.photoURL || undefined} alt={userDetails?.displayName || ''}/>
                    <AvatarFallback className={cn("text-white", currentUserAvatarColors.bg)}>
                      {getInitials(userDetails?.displayName || userDetails?.email || "")}
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
