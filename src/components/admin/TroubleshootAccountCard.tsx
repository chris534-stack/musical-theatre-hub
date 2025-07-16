

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { useTransition, useState, useEffect, useCallback } from 'react';
import { getFullProfileAction, deleteMyProfileAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function TroubleshootAccountCard({ userId }: { userId: string }) {
    const [isChecking, setIsChecking] = useState(true);
    const [isOrphaned, setIsOrphaned] = useState(false);
    const [isDeletePending, startDeleteTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const checkAccountStatus = useCallback(async () => {
        setIsChecking(true);
        const result = await getFullProfileAction(userId);
        if (result.success && result.data?.authStatus === 'notFound') {
            setIsOrphaned(true);
        } else {
            setIsOrphaned(false);
        }
        setIsChecking(false);
    }, [userId]);

    useEffect(() => {
        checkAccountStatus();
    }, [checkAccountStatus]);

    const handleDelete = () => {
        startDeleteTransition(async () => {
            const result = await deleteMyProfileAction();
            if (result.success) {
                toast({
                    title: 'Profile Deleted',
                    description: 'Your orphaned profile data has been cleared. Please sign in again to create a new, synced profile.',
                });
                await signOut(auth);
                router.push('/login');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Deletion Failed',
                    description: result.message || 'An unexpected error occurred.',
                });
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Account Troubleshooting</CardTitle>
                <CardDescription>
                    If you're experiencing account sync issues, you can diagnose and fix them here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isChecking ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Checking account status...</span>
                    </div>
                ) : isOrphaned ? (
                     <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Account Sync Issue Detected</AlertTitle>
                        <AlertDescription className="mt-2 space-y-4">
                            <p>
                                Your account is 'orphaned'. This means your profile data exists in our database, but your authentication record does not. This can happen if an account is partially deleted.
                            </p>
                            <p>
                                To fix this, you must permanently delete your current orphaned profile data. After that, you can sign in again to create a new, healthy profile.
                            </p>
                            <p className="font-semibold">
                                Warning: This action is permanent and will delete your profile bio, photos, and links. Your reviews will remain but will be attributed to "Anonymous".
                            </p>
                            <div className="text-right">
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeletePending}
                                    className="bg-white text-destructive-foreground hover:bg-white/90"
                                >
                                    {isDeletePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Delete My Orphaned Profile
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert>
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>No Issues Detected</AlertTitle>
                        <AlertDescription>
                            Your account appears to be synced correctly. If you're still experiencing issues, please contact support.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
