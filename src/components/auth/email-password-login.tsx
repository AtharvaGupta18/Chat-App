"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { Loader2, KeyRound, Mail } from "lucide-react";

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
import { useAuth } from "../providers";

export default function EmailPasswordLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!currentUser || !currentUser.isAnonymous) {
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
      // Link anonymous account with email/password
      try {
        const credential = EmailAuthProvider.credential(email, password);
        
        // Check if user with this email already exists
        const userDocRef = doc(firestore, "users", `email_${email}`);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
             toast({
                variant: "destructive",
                title: "Sign-up Failed",
                description: "An account with this email already exists. Please sign in instead.",
            });
            setLoading(false);
            return;
        }

        await linkWithCredential(currentUser, credential);

        const userDocRefOld = doc(firestore, "users", currentUser.uid);
        const userDocOld = await getDoc(userDocRefOld);

        if (userDocOld.exists()) {
            const userData = userDocOld.data();
            await setDoc(userDocRef, { ...userData, email });
        } else {
            await setDoc(userDocRef, {
                uid: currentUser.uid,
                email: email,
                createdAt: serverTimestamp(),
            }, { merge: true });
        }


        toast({
          title: "Account Linked",
          description: "Your anonymous account is now linked with your email.",
        });
      } catch (error: any) {
        console.error("Error linking account:", error);
        if (error.code === 'auth/email-already-in-use') {
             toast({
                variant: "destructive",
                title: "Sign-up Failed",
                description: "An account with this email already exists. Please sign in instead.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Sign-up Failed",
                description: error.message,
            });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl">
          {currentUser?.isAnonymous
            ? "Create an Account"
            : "Welcome Back"}
        </CardTitle>
        <CardDescription>
          {currentUser?.isAnonymous
            ? "Save your session by creating an account."
            : "Sign in to your account to continue."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
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
            {currentUser?.isAnonymous ? "Create Account" : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
