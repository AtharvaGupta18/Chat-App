"use client";

import { useState, useEffect } from "react";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Loader2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth, firestore } from "@/lib/firebase";
import { WhisperLinkLogo } from "@/components/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ("recaptchaVerifier" in window) return;
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    (window as any).recaptchaVerifier = verifier;

    return () => {
      verifier.clear();
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.startsWith("+") || phoneNumber.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code.",
      });
      return;
    }
    setLoading(true);
    try {
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
      toast({
        title: "OTP Sent",
        description: `An OTP has been sent to ${phoneNumber}.`,
      });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP.",
      });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;

      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({
        title: "Success",
        description: "You have been logged in successfully.",
      });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        variant: "destructive",
        title: "Failed to verify OTP",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div id="recaptcha-container" />
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <WhisperLinkLogo className="mb-4 h-16 w-16 text-primary" />
          <CardTitle className="text-2xl">Welcome to WhisperLink</CardTitle>
          <CardDescription>
            {confirmationResult
              ? "Enter the OTP sent to your phone."
              : "Sign in securely with your phone number."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!confirmationResult ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 123 456 7890"
                disabled={loading}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  disabled={loading}
                  required
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
              </Button>
              <Button
                variant="link"
                className="w-full"
                onClick={() => setConfirmationResult(null)}
              >
                Use a different number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
