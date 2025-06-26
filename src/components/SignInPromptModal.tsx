'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.357-11.303-8H6.399C9.656,35.663,16.318,40,24,40z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,35.846,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
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