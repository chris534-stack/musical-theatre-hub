

'use client';

import type { UserProfile, Review } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Shield, Drama, Wrench, Users, Camera, CalendarClock, GalleryVerticalEnd, Upload, Loader2, Shuffle, Trash2, ShieldAlert, ShieldCheck, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ReviewPreviewCard } from '@/components/reviews/ReviewPreviewCard';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';
import { PhotoUploader } from '@/components/profile/PhotoUploader';
import { GalleryViewer } from './GalleryViewer';
import { useToast } from '@/hooks/use-toast';
import { updateGalleryOrderAction, deleteProfilePhotoAction, getFullProfileAction, getReviewsForUserAction, generateUploadUrlAction, savePhotoUrlAction } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ProfileLoading from '@/app/profile/[userId]/loading';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

function ProfileStat({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined | null }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
}

function AdminAuthStatusAlert({ profile, isAdmin }: { profile: UserProfile, isAdmin: boolean }) {
    if (!isAdmin || profile.authStatus !== 'notFound') return null;

    return (
        <Alert variant="destructive" className="mb-8">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Admin Alert: Ghost User</AlertTitle>
            <AlertDescription>
                This user profile exists in the database, but their authentication record could not be found. This account may be orphaned and could be a candidate for deletion.
            </AlertDescription>
        </Alert>
    );
};

function ReAuthPrompt({ handleLogout }: { handleLogout: () => void }) {
    return (
        <Alert variant="destructive" className="mb-8">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Account Sync Required</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p>There is an issue with your account session. Please sign out and sign back in to resolve it.</p>
                <Button variant="destructive" onClick={handleLogout} className="shrink-0 bg-white text-destructive-foreground hover:bg-white/90">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </AlertDescription>
        </Alert>
    )
}

export default function ProfileClientPage({ userId }: { userId: string }) {
    const { user, isAdmin } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [yearsInCommunity, setYearsInCommunity] = useState<string | null>(null);

    const GALLERY_PHOTO_LIMIT = 50;
    const PHOTOS_PER_PAGE = 8;
    const [galleryPage, setGalleryPage] = useState(1);
    const [isGalleryViewerOpen, setIsGalleryViewerOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isReordering, setIsReordering] = useState(false);
    const [orderedGalleryUrls, setOrderedGalleryUrls] = useState<string[]>([]);
    const [selectedPhotoToMove, setSelectedPhotoToMove] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
    const headerFileInputRef = useRef<HTMLInputElement>(null);

    const [isReorderPending, startReorderTransition] = useTransition();
    const [isDeletePending, startDeleteTransition] = useTransition();

    const isOwner = user?.uid === userId;

    const fetchProfileData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getFullProfileAction(userId);

            if (result.success && result.data) {
                setProfile(result.data);
                setOrderedGalleryUrls(result.data.galleryImageUrls || []);
                fetchReviewData();
            } else {
                console.error(`[CLIENT] Profile fetch failed: ${result.message}`);
                setError(result.message || 'Could not find user profile.');
                setProfile(null);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
            setError(`An unexpected error occurred while fetching the profile: ${errorMessage}`);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const fetchReviewData = useCallback(async () => {
        try {
            const reviewsResult = await getReviewsForUserAction(userId);
            if (reviewsResult.success && reviewsResult.data) {
                setReviews(reviewsResult.data);
            } else {
                toast({ variant: 'destructive', title: 'Could not load reviews', description: reviewsResult.message });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Could not load reviews', description: 'An unexpected error occurred.' });
        }
    }, [userId, toast]);


    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    useEffect(() => {
        function calculateYearsInCommunity(startDate?: string): string | null {
            if (!startDate?.trim() || !/^\d{4}$/.test(startDate.trim())) return null;
            const currentYear = new Date().getFullYear();
            const startYear = parseInt(startDate.trim(), 10);
            if (isNaN(startYear)) return null;
            const years = currentYear - startYear;
            if (years < 1) return "Less than a year";
            if (years === 1) return "About 1 year";
            return `About ${years} years`;
        }
        if (profile) {
            setYearsInCommunity(calculateYearsInCommunity(profile.communityStartDate));
        }
    }, [profile]);


    const handleHeaderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        const uploaderInput = event.target;

        startDeleteTransition(async () => {
             try {
                const signedUrlResult = await generateUploadUrlAction(userId, file.name, file.type);
                if (!signedUrlResult.success || !signedUrlResult.data) throw new Error(signedUrlResult.message);

                const { uploadUrl } = signedUrlResult.data;
                const uploadResponse = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type }});
                if (!uploadResponse.ok) throw new Error('Upload failed.');

                const saveResult = await savePhotoUrlAction(userId, signedUrlResult.data.filePath);
                if (!saveResult.success) throw new Error(saveResult.message);
                
                toast({ title: 'Upload successful!', description: 'Your photo has been added to the gallery.'});
                await fetchProfileData();

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                toast({ variant: 'destructive', title: 'Upload failed', description: errorMessage });
            } finally {
                 if(uploaderInput) uploaderInput.value = "";
            }
        });
    };

    const handleOpenGallery = (index: number) => {
        if (isReordering || isDeleting) return;
        const overallIndex = (galleryPage - 1) * PHOTOS_PER_PAGE + index;
        setSelectedImageIndex(overallIndex);
        setIsGalleryViewerOpen(true);
    };

    const handleSaveReorder = () => {
        startReorderTransition(async () => {
            const result = await updateGalleryOrderAction(userId, orderedGalleryUrls);
            if (result.success) {
                toast({ title: 'Success', description: 'Your gallery order has been saved.' });
                setIsReordering(false);
                setSelectedPhotoToMove(null);
                await fetchProfileData();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleCancelReorder = () => {
        setIsReordering(false);
        setOrderedGalleryUrls(profile?.galleryImageUrls || []);
        setSelectedPhotoToMove(null);
    };

    const handleReorderClick = (targetUrl: string, targetIndex: number) => {
        if (!isReordering) return;
        if (!selectedPhotoToMove) {
            setSelectedPhotoToMove(targetUrl);
        } else {
            const sourceIndex = orderedGalleryUrls.findIndex(url => url === selectedPhotoToMove);
            if (sourceIndex === -1) {
                setSelectedPhotoToMove(null); return;
            }
            const newOrder = [...orderedGalleryUrls];
            const [itemToMove] = newOrder.splice(sourceIndex, 1);
            newOrder.splice(targetIndex, 0, itemToMove);
            setOrderedGalleryUrls(newOrder);
            setSelectedPhotoToMove(null);
        }
    };

    const handleManagePhotosClick = () => {
        if (isReordering) setIsReordering(false);
        setIsDeleting(!isDeleting);
    };
    
    const handleDeleteClick = (url: string) => {
        setPhotoToDelete(url);
        setIsAlertOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!photoToDelete) return;
        startDeleteTransition(async () => {
            const result = await deleteProfilePhotoAction(userId, photoToDelete);
            if (result.success) {
                toast({ title: "Photo Deleted", description: "The photo has been removed from the gallery." });
                await fetchProfileData();
            } else {
                toast({ variant: 'destructive', title: "Deletion Failed", description: result.message });
            }
            setIsAlertOpen(false);
            setPhotoToDelete(null);
        });
    };

    const handleLogout = async () => {
        try {
          await signOut(auth);
          router.push('/');
        } catch (error) {
          console.error("Error signing out: ", error);
          toast({
            variant: "destructive",
            title: "Logout Failed",
            description: "There was an error signing you out. Please try again.",
          });
        }
    };

    if (isLoading) {
        return <ProfileLoading />;
    }

    if (error || !profile) {
        return (
            <div className="flex flex-1 items-center justify-center text-center">
                <div>
                    <h2 className="text-2xl font-bold font-headline">Profile Not Found</h2>
                    <p className="text-muted-foreground mt-2">{error || "The profile you are looking for does not exist."}</p>
                    <Button asChild className="mt-4"><Link href="/">Go Home</Link></Button>
                </div>
            </div>
        );
    }
    
    const roleIcons = { Performer: Drama, Technician: Wrench, Designer: Wrench, Director: Drama, Audience: Users, Other: Users };
    const RoleIcon = profile.roleInCommunity ? roleIcons[profile.roleInCommunity] : Users;
    const currentPhotoCount = orderedGalleryUrls.length;
    const canUpload = currentPhotoCount < GALLERY_PHOTO_LIMIT;
    const photosToDisplay = isReordering ? orderedGalleryUrls : (profile.galleryImageUrls || []);
    
    const totalPages = Math.ceil(photosToDisplay.length / PHOTOS_PER_PAGE);
    const paginatedPhotos = photosToDisplay.slice((galleryPage - 1) * PHOTOS_PER_PAGE, galleryPage * PHOTOS_PER_PAGE);

    const showReAuthPrompt = isOwner && profile.authStatus === 'notFound';
    
    return (
        <>
            <input type="file" accept="image/*" className="sr-only" ref={headerFileInputRef} onChange={handleHeaderUpload} disabled={isDeletePending}/>
            <div className="w-full pb-16">
                <div className="h-48 md:h-64 bg-secondary relative">
                    <Image src={profile.coverPhotoUrl || "https://placehold.co/1600x400.png"} alt="Cover photo" fill className="object-cover" data-ai-hint="theatre background" unoptimized/>
                </div>

                <div className="container mx-auto -mt-20 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end md:gap-8">
                        <div className="flex-shrink-0">
                            <Avatar className="h-36 w-36 border-4 border-background ring-2 ring-primary">
                                <AvatarImage src={profile.photoURL} alt={profile.displayName} className="object-cover" />
                                <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                        
                        <div className="mt-6 md:mt-0 flex-grow flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-bold font-headline">{profile.displayName}</h1>
                                {profile.showEmail && (<p className="text-muted-foreground flex items-center gap-2 mt-1"><Mail className="h-4 w-4" />{profile.email}</p>)}
                            </div>
                            <div className="flex gap-2">
                                {isOwner && (<Button onClick={() => setIsSheetOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>)}
                                {isOwner && isAdmin && (<Button asChild variant="outline"><Link href="/admin"><Shield className="mr-2 h-4 w-4" /> Admin</Link></Button>)}
                                {isOwner && !showReAuthPrompt && (<Button variant="ghost" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/> Logout</Button>)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        {showReAuthPrompt ? <ReAuthPrompt handleLogout={handleLogout} /> : <AdminAuthStatusAlert profile={profile} isAdmin={isAdmin} />}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <Card><CardHeader><CardTitle>About Me</CardTitle></CardHeader><CardContent><p className="text-muted-foreground whitespace-pre-wrap">{profile.bio || (isOwner ? "Tell the community a bit about yourself!" : "This user hasn't written a bio yet.")}</p></CardContent></Card>
                            <Card><CardHeader><CardTitle>Community Details</CardTitle></CardHeader><CardContent className="space-y-4"><ProfileStat icon={RoleIcon} label="Primary Role" value={profile.roleInCommunity} /><ProfileStat icon={CalendarClock} label="In Community For" value={yearsInCommunity} /></CardContent></Card>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex flex-col"><CardTitle>{isReordering ? "Reorder Photos" : isDeleting ? "Delete Photos" : `Gallery (${currentPhotoCount}/${GALLERY_PHOTO_LIMIT})`}</CardTitle>{isReordering && <p className="text-xs text-muted-foreground mt-1">Select a photo, then select a new position.</p>}</div>
                                    {(isOwner || isAdmin) && (<div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap">{isReordering ? (<><Button variant="outline" size="sm" onClick={handleCancelReorder} disabled={isReorderPending}>Cancel</Button><Button size="sm" onClick={handleSaveReorder} disabled={isReorderPending}>{isReorderPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Order</Button></>) : isDeleting ? (<Button variant="outline" size="sm" onClick={handleManagePhotosClick}><Trash2 className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Done</span></Button>) : (<>{isOwner && canUpload && (<Button size="sm" onClick={() => headerFileInputRef.current?.click()} disabled={isDeletePending}>{isDeletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="sm:mr-2 h-4 w-4" />}<span className="hidden sm:inline">Upload</span></Button>)}{currentPhotoCount > 1 && <Button variant="outline" size="sm" onClick={() => setIsReordering(true)}><Shuffle className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Reorder</span></Button>}{currentPhotoCount > 0 && <Button variant="outline" size="sm" onClick={handleManagePhotosClick}><Trash2 className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Manage</span></Button>}</>)}</div>)}
                                </CardHeader>
                                <CardContent>
                                    {isDeleting && (<Alert variant="destructive" className="mb-4"><ShieldAlert className="h-4 w-4" /><AlertTitle>Deletion Mode</AlertTitle><AlertDescription>Click the trash icon on any photo to permanently delete it. This action cannot be undone.</AlertDescription></Alert>)}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {(isReordering ? photosToDisplay : paginatedPhotos).map((url, index) => {
                                            const isSelectedForMove = selectedPhotoToMove === url;
                                            return (
                                                <div key={url} onClick={() => isReordering ? handleReorderClick(url, index) : handleOpenGallery(index)} className={cn("aspect-square relative rounded-lg overflow-hidden group transition-all duration-200", (isReordering || !isDeleting) && "cursor-pointer", isReordering && isSelectedForMove && "ring-4 ring-offset-2 ring-primary z-10 scale-105 shadow-lg", isReordering && selectedPhotoToMove && !isSelectedForMove && "opacity-60 hover:opacity-100 hover:scale-105")}>
                                                    <Image src={url} alt={`Gallery image ${index + 1}`} fill className="object-cover" data-ai-hint="production photo" unoptimized />
                                                    <div className={cn("absolute inset-0 bg-black/0 transition-colors flex items-center justify-center", !isDeleting && !isReordering && "group-hover:bg-black/20", isReordering && "group-hover:bg-black/40", isDeleting && "group-hover:bg-black/50")} >
                                                        {isReordering && selectedPhotoToMove && !isSelectedForMove && (<p className="text-white font-bold text-sm bg-black/50 p-2 rounded-md opacity-0 group-hover:opacity-100">Place Here</p>)}
                                                    </div>
                                                    {isDeleting && (<Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={(e) => { e.stopPropagation(); handleDeleteClick(url); }} disabled={isDeletePending}><Trash2 className="h-4 w-4" /></Button>)}
                                                </div>
                                            );
                                        })}
                                        {isOwner && !isReordering && !isDeleting && canUpload && (
                                            <PhotoUploader userId={profile.userId} onUploadComplete={fetchProfileData} isGridItem={true} limit={GALLERY_PHOTO_LIMIT} currentCount={currentPhotoCount} />
                                        )}
                                        {paginatedPhotos.length === 0 && !isOwner && (
                                            <div className="col-span-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                                <Camera className="h-10 w-10 mb-2" />
                                                <p className="font-medium">No Photos Yet</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                {!isReordering && !isDeleting && totalPages > 1 && (
                                    <CardFooter className="flex justify-between items-center">
                                        <Button variant="outline" onClick={() => setGalleryPage(p => p - 1)} disabled={galleryPage === 1}>
                                            Previous
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            Page {galleryPage} of {totalPages}
                                        </span>
                                        <Button variant="outline" onClick={() => setGalleryPage(p => p + 1)} disabled={galleryPage === totalPages}>
                                            Next
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                             <section>
                                <h2 className="text-2xl font-bold font-headline mb-4">Recent Reviews</h2>
                                {reviews.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {reviews.map(review => (
                                            <ReviewPreviewCard key={review.id} review={review} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">This user hasn't written any reviews yet.</p>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            
            <GalleryViewer isOpen={isGalleryViewerOpen} onClose={() => setIsGalleryViewerOpen(false)} images={profile.galleryImageUrls || []} startIndex={selectedImageIndex} userName={profile.displayName} userId={profile.userId} isOwner={isOwner} onUpdate={fetchProfileData} />
            
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the photo from the gallery and from storage.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeletePending}>{isDeletePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

            {isOwner && (<EditProfileSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} profile={profile} onProfileUpdate={fetchProfileData} />)}
        </>
    );
}
