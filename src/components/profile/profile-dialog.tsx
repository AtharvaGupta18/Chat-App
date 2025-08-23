
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Loader2 } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, getDocs, collection, query, where } from "firebase/firestore";
import { firestore, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn, generateAvatarColor, getInitials } from "@/lib/utils";

export default function ProfileDialog() {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userDetails) {
      setName(userDetails.displayName || "");
      setUsername(userDetails.username || "");
      setBio(userDetails.bio || "");
    }
  }, [userDetails, open]);

  const handleSaveChanges = async () => {
    if (!user || !userDetails) return;
    setLoading(true);

    try {
      const dataToUpdate: { [key: string]: any } = {};
      const authProfileToUpdate: { [key: string]: any } = {};

      if (username !== userDetails.username) {
        if (username.trim() === "") {
            toast({ variant: "destructive", title: "Error", description: "Username cannot be empty." });
            setLoading(false);
            return;
        }
        const usersRef = collection(firestore, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Username is already taken.",
            });
            setLoading(false);
            return;
        }
        dataToUpdate.username = username;
      }
      
      if (name !== userDetails.displayName) {
          dataToUpdate.displayName = name;
          authProfileToUpdate.displayName = name;
      }
      
      if (bio !== userDetails.bio) {
          dataToUpdate.bio = bio;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        const userDocRef = doc(firestore, "users", user.uid);
        await updateDoc(userDocRef, dataToUpdate);
      }

      if (Object.keys(authProfileToUpdate).length > 0 && auth.currentUser) {
        await updateProfile(auth.currentUser, authProfileToUpdate);
      }
      
      if(Object.keys(dataToUpdate).length > 0 || Object.keys(authProfileToUpdate).length > 0) {
        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });
      }

      setOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!user || !userDetails) return null;

  const userAvatarColors = generateAvatarColor(user.uid);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" title="Edit Profile">
          <Edit />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className={cn("h-24 w-24 ring-2 ring-offset-2 ring-offset-background", userAvatarColors.ring)}>
                <AvatarImage src={userDetails.photoURL || undefined} alt="Profile Picture"/>
                <AvatarFallback className={cn("text-4xl text-white", userAvatarColors.bg)}>
                  {getInitials(name || userDetails?.email || "")}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              placeholder="Your unique username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little about yourself"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSaveChanges} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
