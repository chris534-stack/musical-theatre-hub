

'use client';

import type { UserProfile, Review } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState, useEffect, useTransition, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Shield, Drama, Wrench, Users, Camera, CalendarClock, GalleryVerticalEnd, Upload, Loader2, Shuffle, Trash2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ReviewPreviewCard } from '@/components/reviews/ReviewPreviewCard';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';
import { PhotoUploader } from '@/components/profile/PhotoUploader';
import { GalleryViewer } from './GalleryViewer';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { updateGalleryOrderAction, deleteProfilePhotoAction, setProfilePhotoAction, setCoverPhotoAction, uploadProfilePhotoAction } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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
    if (!isAdmin) return null;

    if (profile.authStatus === 'notFound') {
        return (
            <Alert variant="destructive" className="mb-8">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Admin Alert: Ghost User</AlertTitle>
                <AlertDescription>
                    This user profile exists in the database, but their authentication record could not be found. This account may be orphaned and could be a candidate for deletion.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Alert className="mb-8 bg-secondary">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Admin Info: Auth Status</AlertTitle>
            <AlertDescription>
                User authentication status is active.
            </AlertDescription>
        </Alert>
    );
};

export default function ProfileClientPage({ initialProfile, initialReviews }: { initialProfile: UserProfile, initialReviews: Review[] }) {
    const { user, isAdmin } = useAuth();
    const [profile, setProfile] = useState(initialProfile);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [yearsInCommunity, setYearsInCommunity] = useState<string | null>(null);
    const GALLERY_PHOTO_LIMIT = 50;
    const PHOTOS_PER_PAGE = 4;

    const [isGalleryViewerOpen, setIsGalleryViewerOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const [isReorderPending, startReorderTransition] = useTransition();
    const [isUploadPending, startUploadTransition] = useTransition();
    const { toast } = useToast();
    
    const [isReordering, setIsReordering] = useState(false);
    const [orderedGalleryUrls, setOrderedGalleryUrls] = useState<string[]>([]);
    const [selectedPhotoToMove, setSelectedPhotoToMove] = useState<string | null>(null);
    
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
    const [isDeletePending, startDeleteTransition] = useTransition();

    const headerFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setProfile(initialProfile);
        setOrderedGalleryUrls(initialProfile.galleryImageUrls || []);
    }, [initialProfile]);


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
        
        setYearsInCommunity(calculateYearsInCommunity(profile.communityStartDate));
    }, [profile.communityStartDate]);

    const isOwner = user?.uid === profile.userId;

    const roleIcons = {
        Performer: Drama,
        Technician: Wrench,
        Designer: Wrench,
        Director: Drama,
        Audience: Users,
        Other: Users,
    };
    const RoleIcon = profile.roleInCommunity ? roleIcons[profile.roleInCommunity] : Users;
    
    const onProfileUpdate = () => {
        // This function is intentionally left empty.
        // Server actions use `revalidatePath`, and the Next.js router
        // will automatically handle refreshing the page with the new data.
        // This avoids client-side state mismatches.
    };
    
    const handlePhotoUploadComplete = () => {
        // This function is intentionally left empty.
        // Server actions use `revalidatePath`, and the Next.js router
        // will automatically handle refreshing the page with the new data.
        // This avoids client-side state mismatches.
    };
    
    const handleHeaderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('userId', profile.userId);

        startUploadTransition(async () => {
            const result = await uploadProfilePhotoAction(formData);
            if (result.success) {
                toast({
                    title: 'Upload successful!',
                    description: 'Your photo has been added to the gallery.',
                });
                onProfileUpdate(); // This will trigger a re-render with fresh data due to revalidatePath
                if(headerFileInputRef.current) {
                    headerFileInputRef.current.value = ""; // Reset file input
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Upload failed',
                    description: result.message,
                });
            }
        });
    };

    const handleOpenGallery = (index: number) => {
        if (isReordering || isDeleting) return;
        setSelectedImageIndex(index);
        setIsGalleryViewerOpen(true);
    };
    
    const currentPhotoCount = orderedGalleryUrls.length;
    const canUpload = currentPhotoCount < GALLERY_PHOTO_LIMIT;

    const handleSaveReorder = () => {
        startReorderTransition(async () => {
            const result = await updateGalleryOrderAction(profile.userId, orderedGalleryUrls);
            if (result.success) {
                toast({ title: 'Success', description: 'Your gallery order has been saved.' });
                setIsReordering(false);
                setSelectedPhotoToMove(null);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleCancelReorder = () => {
        setIsReordering(false);
        setOrderedGalleryUrls(profile.galleryImageUrls || []);
        setSelectedPhotoToMove(null);
    };
    
    const handleReorderClick = (targetUrl: string, targetIndex: number) => {
        if (!isReordering) return;

        if (!selectedPhotoToMove) {
            setSelectedPhotoToMove(targetUrl);
        } else {
            const sourceIndex = orderedGalleryUrls.findIndex(url => url === selectedPhotoToMove);
            if (sourceIndex === -1) {
                setSelectedPhotoToMove(null);
                return;
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
    }
    
    const handleDeleteClick = (url: string) => {
        setPhotoToDelete(url);
        setIsAlertOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!photoToDelete) return;
        
        startDeleteTransition(async () => {
            const result = await deleteProfilePhotoAction(profile.userId, photoToDelete);
            if (result.success) {
                toast({ title: "Photo Deleted", description: "The photo has been removed from the gallery." });
            } else {
                toast({ variant: 'destructive', title: "Deletion Failed", description: result.message });
            }
            setIsAlertOpen(false);
            setPhotoToDelete(null);
        });
    };

    const itemsToShowInGrid = [
        ...(isReordering ? orderedGalleryUrls : (profile.galleryImageUrls || [])),
        ...(isOwner && !isReordering && !isDeleting && canUpload ? ['uploader'] : [])
    ];
    const pages = [];
    for (let i = 0; i < itemsToShowInGrid.length; i += PHOTOS_PER_PAGE) {
        pages.push(itemsToShowInGrid.slice(i, i + PHOTOS_PER_PAGE));
    }

    return (
        <>
            <input
                type="file"
                accept="image/*"
                className="sr-only"
                ref={headerFileInputRef}
                onChange={handleHeaderUpload}
                disabled={isUploadPending}
            />
            <div className="w-full pb-16">
                <div className="h-48 md:h-64 bg-secondary relative">
                    <Image
                        src={profile.coverPhotoUrl || "https://placehold.co/1600x400.png"}
                        alt="Cover photo"
                        fill
                        className="object-cover"
                        data-ai-hint="theatre background"
                        unoptimized
                    />
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
                                {profile.showEmail && (
                                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                        <Mail className="h-4 w-4" />
                                        {profile.email}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {isOwner && (
                                    <Button onClick={() => setIsSheetOpen(true)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                    </Button>
                                )}
                                {isOwner && isAdmin && (
                                    <Button asChild variant="outline">
                                        <Link href="/admin">
                                            <Shield className="mr-2 h-4 w-4" /> Admin Dashboard
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        <AdminAuthStatusAlert profile={profile} isAdmin={isAdmin} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <Card>
                                <CardHeader><CardTitle>About Me</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {profile.bio || (isOwner ? "Tell the community a bit about yourself!" : "This user hasn't written a bio yet.")}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Community Details</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <ProfileStat icon={RoleIcon} label="Primary Role" value={profile.roleInCommunity} />
                                    <ProfileStat icon={CalendarClock} label="In Community For" value={yearsInCommunity} />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex flex-col">
                                        <CardTitle>{isReordering ? "Reorder Photos" : isDeleting ? "Delete Photos" : `Gallery (${currentPhotoCount}/${GALLERY_PHOTO_LIMIT})`}</CardTitle>
                                        {isReordering && <p className="text-xs text-muted-foreground mt-1">Select a photo, then select a new position.</p>}
                                    </div>
                                    {(isOwner || isAdmin) && (
                                        <div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap">
                                            {isReordering ? (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={handleCancelReorder} disabled={isReorderPending}>Cancel</Button>
                                                    <Button size="sm" onClick={handleSaveReorder} disabled={isReorderPending}>
                                                        {isReorderPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Save Order
                                                    </Button>
                                                </>
                                            ) : isDeleting ? (
                                                <Button variant="outline" size="sm" onClick={handleManagePhotosClick}>
                                                    <Trash2 className="sm:mr-2 h-4 w-4" />
                                                    <span className="hidden sm:inline">Done</span>
                                                </Button>
                                            ) : (
                                                <>
                                                    {isOwner && canUpload && (
                                                        <Button size="sm" onClick={() => headerFileInputRef.current?.click()} disabled={isUploadPending}>
                                                            {isUploadPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="sm:mr-2 h-4 w-4" />}
                                                            <span className="hidden sm:inline">Upload</span>
                                                        </Button>
                                                    )}
                                                    {currentPhotoCount > 1 && <Button variant="outline" size="sm" onClick={() => setIsReordering(true)}><Shuffle className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Reorder</span></Button>}
                                                    {currentPhotoCount > 0 && <Button variant="outline" size="sm" onClick={handleManagePhotosClick}><Trash2 className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Manage</span></Button>}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {isDeleting && (
                                        <Alert variant="destructive" className="mb-4">
                                            <ShieldAlert className="h-4 w-4" />
                                            <AlertTitle>Deletion Mode</AlertTitle>
                                            <AlertDescription>
                                                Click the trash icon on any photo to permanently delete it. This action cannot be undone. Please ensure photos adhere to community guidelines.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    {itemsToShowInGrid.length === 0 ? (
                                        isOwner && canUpload ? (
                                            <PhotoUploader userId={profile.userId} onUploadComplete={handlePhotoUploadComplete} limit={GALLERY_PHOTO_LIMIT} currentCount={currentPhotoCount} />
                                        ) : !canUpload ? (
                                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                                <GalleryVerticalEnd className="h-10 w-10 mb-2" />
                                                <p className="font-medium text-foreground">Gallery Full</p>
                                                <p className="text-sm mt-1">You've reached the photo limit.</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                                <Camera className="h-10 w-10 mb-2" />
                                                <p className="font-medium">No Photos Yet</p>
                                                <p className="text-sm">This user hasn't added any photos to their gallery.</p>
                                            </div>
                                        )
                                    ) : (
                                        <Carousel opts={{ align: "start" }} className="w-full relative px-8 sm:px-12">
                                            <CarouselContent>
                                                {pages.map((pageItems, pageIndex) => (
                                                    <CarouselItem key={pageIndex}>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {pageItems.map((item, itemIndex) => {
                                                                if (item === 'uploader') {
                                                                    return <PhotoUploader key="uploader" userId={profile.userId} onUploadComplete={handlePhotoUploadComplete} isGridItem={true} limit={GALLERY_PHOTO_LIMIT} currentCount={currentPhotoCount} />;
                                                                }
                                                                const originalImageIndex = pageIndex * PHOTOS_PER_PAGE + itemIndex;
                                                                const url = isReordering ? orderedGalleryUrls[originalImageIndex] : item;
                                                                const isSelectedForMove = selectedPhotoToMove === url;
                                                                
                                                                return (
                                                                    <div
                                                                        key={url}
                                                                        onClick={() => isReordering ? handleReorderClick(url, originalImageIndex) : handleOpenGallery(originalImageIndex)}
                                                                        className={cn(
                                                                            "aspect-square relative rounded-lg overflow-hidden group transition-all duration-200",
                                                                            (isReordering || !isDeleting) && "cursor-pointer",
                                                                            isReordering && isSelectedForMove && "ring-4 ring-offset-2 ring-primary z-10 scale-105 shadow-lg",
                                                                            isReordering && selectedPhotoToMove && !isSelectedForMove && "opacity-60 hover:opacity-100 hover:scale-105"
                                                                        )}
                                                                    >
                                                                        <Image src={url} alt={`Gallery image ${originalImageIndex + 1}`} fill className="object-cover" data-ai-hint="production photo" unoptimized />
                                                                        <div className={cn(
                                                                            "absolute inset-0 bg-black/0 transition-colors flex items-center justify-center",
                                                                            !isDeleting && !isReordering && "group-hover:bg-black/20",
                                                                            isReordering && "group-hover:bg-black/40",
                                                                            isDeleting && "group-hover:bg-black/50"
                                                                        )} >
                                                                            {isReordering && selectedPhotoToMove && !isSelectedForMove && (
                                                                                <p className="text-white font-bold text-sm bg-black/50 p-2 rounded-md opacity-0 group-hover:opacity-100">Place Here</p>
                                                                            )}
                                                                        </div>
                                                                        {isDeleting && (
                                                                            <Button
                                                                                variant="destructive"
                                                                                size="icon"
                                                                                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(url); }}
                                                                                disabled={isDeletePending}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-10" />
                                            <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-10" />
                                        </Carousel>
                                    )}
                                </CardContent>
                            </Card>
                             <section>
                                <h2 className="text-2xl font-bold font-headline mb-4">Recent Reviews</h2>
                                {initialReviews.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {initialReviews.map(review => (
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
            
            <GalleryViewer
                isOpen={isGalleryViewerOpen}
                onClose={() => setIsGalleryViewerOpen(false)}
                images={profile.galleryImageUrls || []}
                startIndex={selectedImageIndex}
                userName={profile.displayName}
                userId={profile.userId}
                isOwner={isOwner}
            />
            
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the photo from the gallery and from storage.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeletePending}>
                            {isDeletePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isOwner && (
                <EditProfileSheet 
                    isOpen={isSheetOpen} 
                    onClose={() => setIsSheetOpen(false)}
                    profile={profile}
                    onProfileUpdate={onProfileUpdate}
                />
            )}
        </>
    );
}
