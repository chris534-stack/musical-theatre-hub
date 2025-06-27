'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useState } from 'react';
import Image from 'next/image';

const GoogleIcon = (props: { className?: string }) => (
    <Image 
      src="/google-logo.png" 
      alt="Google logo" 
      width={24} 
      height={24}
      className={props.className}
      data-ai-hint="google logo"
    />
);


interface SignInPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SignInPromptModal({ isOpen, onClose }: SignInPromptModalProps) {

    const handleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            onClose(); // Close modal on successful sign-in
        } catch (error) {
            console.error('Error signing in with Google from modal', error);
            // Optionally, display an error message to the user in the modal
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-semibold mb-4">Sign in to Suggest an Idea</h3>
                <p className="mb-6 text-muted-foreground">
                    To submit your idea, please sign in or sign up with your Google account.
                </p>
                <Button onClick={handleSignIn} className="w-full max-w-xs">
                    <GoogleIcon className="mr-2 h-6 w-6" />
                    Sign in with Google
                </Button>
            </DialogContent>
        </Dialog>
    );
}
