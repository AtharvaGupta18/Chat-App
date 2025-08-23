
"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc, getDocs, query, where, collection } from "firebase/firestore";
import { Loader2, KeyRound, Mail, User as UserIcon, AtSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth, firestore } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EmailPasswordLogin() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // Regular Sign In
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "Success",
          description: "You have been logged in successfully.",
        });
      } catch (error: any) {
        console.error("Error signing in:", error);
        toast({
          variant: "destructive",
          title: "Sign-in Failed",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Sign Up
      try {
        // Check for username uniqueness
        const usersRef = collection(firestore, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          toast({
            variant: "destructive",
            title: "Sign-up Failed",
            description: "Username is already taken. Please choose another one.",
          });
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        await updateProfile(newUser, { displayName: name });

        await setDoc(doc(firestore, "users", newUser.uid), {
            uid: newUser.uid,
            email: newUser.email,
            displayName: name,
            username: username,
            createdAt: serverTimestamp(),
            bio: "",
            photoURL: "",
        });
        
        toast({
          title: "Account Created",
          description: "Your account has been created successfully.",
        });

      } catch (error: any) {
        console.error("Error signing up:", error);
        toast({
            variant: "destructive",
            title: "Sign-up Failed",
            description: error.message,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Sign in to your account to continue."
            : "Enter your details to sign up."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuthAction} className="space-y-4">
         {!isLogin && (
          <>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                disabled={loading}
                required
                className="pl-10"
              />
            </div>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                placeholder="Username"
                disabled={loading}
                required
                className="pl-10"
              />
            </div>
          </>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={loading}
              required
              className="pl-10"
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              required
              className="pl-10"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>
         <div className="mt-4 text-center text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <Button variant="link" className="p-0 h-auto" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Sign In"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
