
"use client";

import { useState, useRef } from "react";
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
import { Camera, Edit, Loader2 } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, getDocs, collection, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function ProfileDialog() {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(userDetails?.displayName || "");
  const [username, setUsername] = useState(userDetails?.username || "");
  const [bio, setBio] = useState(userDetails?.bio || "");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(userDetails?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !userDetails) return;
    setLoading(true);

    try {
      let photoURL = userDetails?.photoURL || "";

      if (username !== userDetails.username) {
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
      }

      if (profilePic) {
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, profilePic);
        photoURL = await getDownloadURL(storageRef);
      }
      
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: name,
        username: username,
        bio: bio,
        photoURL: photoURL,
      });

      if(auth.currentUser){
        await updateProfile(auth.currentUser, {
            displayName: name,
            photoURL: photoURL,
        });
      }

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
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
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

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
              <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                <AvatarImage src={profilePicPreview || undefined} alt="Profile Picture"/>
                <AvatarFallback className="text-4xl">
                  {name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5" onClick={handleAvatarClick}>
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
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
