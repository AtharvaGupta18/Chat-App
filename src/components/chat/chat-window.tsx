
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
  deleteDoc,
  limit,
} from "firebase/firestore";
import { SendHorizonal, User as UserIcon, Check, CheckCheck, ArrowLeft, MoreHorizontal, FilePen, Trash, Loader2, Reply, X } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getInitials, generateAvatarColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";
import { motion, useAnimation } from "framer-motion";

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
  isEdited?: boolean;
  replyTo?: {
    messageId: string;
    text: string;
    senderId: string;
    senderName: string;
  };
}

export default function ChatWindow({ recipient, onBack }: ChatWindowProps) {
  const { user: currentUser, userDetails } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
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

    const messageData: any = {
      text: messageText,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      status: 'delivered',
    };

    if (replyingTo) {
      messageData.replyTo = {
        messageId: replyingTo.id,
        text: replyingTo.text,
        senderId: replyingTo.senderId,
        senderName: replyingTo.senderId === currentUser.uid ? userDetails.displayName : recipient.displayName,
      };
      setReplyingTo(null);
    }

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
      batch.set(newMessageRef, messageData);
      
      await batch.commit();
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleSaveEdit = async () => {
    if (!chatId || !editingMessageId || !editingText.trim()) return;
    setIsSavingEdit(true);

    try {
        const messageRef = doc(firestore, "chats", chatId, "messages", editingMessageId);
        await updateDoc(messageRef, {
            text: editingText,
            isEdited: true,
        });

        // If this was the last message, update the chat preview
        const lastMessage = messages[messages.length -1];
        if (lastMessage.id === editingMessageId) {
            const chatRef = doc(firestore, "chats", chatId);
            await updateDoc(chatRef, { lastMessage: editingText });
        }

        toast({ title: "Success", description: "Message updated successfully." });
    } catch (error) {
        console.error("Error updating message:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to update message." });
    } finally {
        setEditingMessageId(null);
        setEditingText("");
        setIsSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!chatId) return;

    try {
        await deleteDoc(doc(firestore, "chats", chatId, "messages", messageId));

        const chatRef = doc(firestore, "chats", chatId);
        const lastMessage = messages[messages.length - 1];

        if (lastMessage.id === messageId) {
            if (messages.length > 1) {
                const newLastMessage = messages[messages.length - 2];
                 await updateDoc(chatRef, { 
                    lastMessage: newLastMessage.text,
                    lastMessageTimestamp: newLastMessage.createdAt,
                });
            } else {
                await updateDoc(chatRef, { 
                    lastMessage: "Chat started",
                    lastMessageTimestamp: serverTimestamp(),
                });
            }
        }
        
        toast({ title: "Success", description: "Message deleted successfully." });
    } catch (error) {
        console.error("Error deleting message:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to delete message." });
    }
  };
  
  const recipientAvatarColors = recipient ? generateAvatarColor(recipient.uid) : {};

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
        <div className="p-4 space-y-2">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.senderId === currentUser?.uid}
                recipient={recipient}
                onReply={handleReplyToMessage}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                editingMessageId={editingMessageId}
                editingText={editingText}
                setEditingText={setEditingText}
                isSavingEdit={isSavingEdit}
              />
            ))}
        </div>
      </ScrollArea>

      <footer className="border-t p-4 space-y-2">
        {replyingTo && (
            <div className="p-2 bg-muted rounded-md flex justify-between items-center text-sm">
                <div>
                    <p className="font-semibold text-primary">Replying to {replyingTo.senderId === currentUser?.uid ? 'yourself' : recipient.displayName}</p>
                    <p className="text-muted-foreground truncate">{replyingTo.text}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCancelReply}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            disabled={editingMessageId !== null}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || editingMessageId !== null}>
            <SendHorizonal className="h-5 w-5" />
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  recipient: ChatUser;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  editingMessageId: string | null;
  editingText: string;
  setEditingText: (text: string) => void;
  isSavingEdit: boolean;
}

function ChatMessage({
  message,
  isCurrentUser,
  recipient,
  onReply,
  onEdit,
  onDelete,
  onCancelEdit,
  onSaveEdit,
  editingMessageId,
  editingText,
  setEditingText,
  isSavingEdit
}: ChatMessageProps) {
  const { user: currentUser, userDetails } = useAuth();
  const controls = useAnimation();
  const dragRef = useRef<HTMLDivElement>(null);

  const recipientAvatarColors = generateAvatarColor(recipient.uid);
  const currentUserAvatarColors = userDetails ? generateAvatarColor(userDetails.uid) : {};

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    const dragThreshold = 50;
    if (info.offset.x > dragThreshold) {
      onReply(message);
    }
    controls.start({ x: 0 });
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

  return (
    <div
      className={cn(
        "flex items-end gap-1 group relative",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
       <div className={cn("absolute flex items-center h-full -z-10", isCurrentUser ? "right-full mr-2" : "left-full ml-2" )}>
            <Reply className="h-5 w-5 text-muted-foreground" />
       </div>

      <motion.div
        ref={dragRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        dragElastic={{ right: 0.1, left: 0 }}
        className={cn(
            "flex items-end gap-1 w-full",
            isCurrentUser ? "justify-end" : "justify-start"
        )}
        style={{
            x: 0,
            ...(isCurrentUser ? { paddingRight: "0" } : { paddingLeft: "0" }),
        }}
      >
        {!isCurrentUser && (
          <Avatar className={cn('h-8 w-8 ring-2 ring-offset-2 ring-offset-background', recipientAvatarColors.ring)}>
            <AvatarImage src={recipient.photoURL || undefined} alt={recipient.displayName || ''} />
            <AvatarFallback className={cn("text-white", recipientAvatarColors.bg)}>
              {getInitials(recipient.displayName || recipient.email || "")}
            </AvatarFallback>
          </Avatar>
        )}

        {editingMessageId === message.id ? (
          <div className="w-full max-w-lg space-y-2">
            <Textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSaveEdit();
                }
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>Cancel</Button>
              <Button size="sm" onClick={onSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {isCurrentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onReply(message)}>
                      <Reply className="mr-2 h-4 w-4" />
                      <span>Reply</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(message)}>
                      <FilePen className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your message.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(message.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {!isCurrentUser && (
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onReply(message)}>
                  <Reply className="h-5 w-5" />
                </Button>
              )}

              <div
                className={cn(
                  "rounded-lg px-4 py-2 flex flex-col",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.replyTo && (
                  <div className="border-l-2 border-primary-foreground/50 pl-2 mb-2 text-xs text-primary-foreground/80 bg-black/10 p-2 rounded-md">
                    <p className="font-semibold">{message.replyTo.senderId === currentUser?.uid ? "You" : message.replyTo.senderName}</p>
                    <p className="truncate">{message.replyTo.text}</p>
                  </div>
                )}
                <div className="flex items-end gap-2 max-w-sm md:max-w-md lg:max-w-lg">
                  <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                  <div className="flex-shrink-0 self-end flex items-center gap-1">
                    {message.isEdited && <span className="text-xs text-primary-foreground/70">(edited)</span>}
                    {isCurrentUser && (
                      <MessageStatus status={message.status} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {isCurrentUser && userDetails && editingMessageId !== message.id && (
          <Avatar className={cn('h-8 w-8 ring-2 ring-offset-2 ring-offset-background', currentUserAvatarColors.ring)}>
            <AvatarImage src={userDetails?.photoURL || undefined} alt={userDetails?.displayName || ''} />
            <AvatarFallback className={cn("text-white", currentUserAvatarColors.bg)}>
              {getInitials(userDetails?.displayName || userDetails?.email || "")}
            </AvatarFallback>
          </Avatar>
        )}
      </motion.div>
    </div>
  );
}
