
'use client';

import type { UserProfile, Review } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState, useEffect, useTransition, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Shield, Drama, Wrench, Users, Camera, CalendarClock, GalleryVerticalEnd, Upload, GripVertical, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ReviewPreviewCard } from '@/components/reviews/ReviewPreviewCard';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';
import { PhotoUploader } from '@/components/profile/PhotoUploader';
import { GalleryViewer } from './GalleryViewer';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { uploadProfilePhotoAction, updateGalleryOrderAction } from '@/lib/actions';
import { DragDropContext, Draggable, type OnDragEndResponder } from '@hello-pangea/dnd';
import { StrictModeDroppable } from '@/components/dnd/StrictModeDroppable';
import { cn } from '@/lib/utils';

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

export default function ProfileClientPage({ initialProfile, initialReviews }: { initialProfile: UserProfile, initialReviews: Review[] }) {
    const { user, isAdmin } = useAuth();
    const [profile, setProfile] = useState(initialProfile);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [yearsInCommunity, setYearsInCommunity] = useState<string | null>(null);
    const GALLERY_PHOTO_LIMIT = 50;
    const PHOTOS_PER_PAGE = 6;

    const [isGalleryViewerOpen, setIsGalleryViewerOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const headerPhotoInputRef = useRef<HTMLInputElement>(null);
    const [isPhotoUpdatePending, startPhotoUpdateTransition] = useTransition();
    const [isReorderPending, startReorderTransition] = useTransition();
    const { toast } = useToast();
    
    const [isReordering, setIsReordering] = useState(false);
    const [orderedGalleryUrls, setOrderedGalleryUrls] = useState<string[]>([]);
    
    useEffect(() => {
        setOrderedGalleryUrls(profile.galleryImageUrls || []);
    }, [profile.galleryImageUrls]);


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
    
    const onProfileUpdate = (updatedProfile: UserProfile) => {
        setProfile(updatedProfile);
    };
    
    const handlePhotoUploadComplete = (newUrl: string) => {
        setProfile(prev => ({
            ...prev,
            galleryImageUrls: [...(prev.galleryImageUrls || []), newUrl],
        }));
    };

    const handleHeaderPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);
        formData.append('userId', profile.userId);

        startPhotoUpdateTransition(async () => {
            const result = await uploadProfilePhotoAction(formData);
            if (result.success && result.url) {
                toast({
                    title: 'Upload successful!',
                    description: 'Your photo has been added to the gallery.',
                });
                handlePhotoUploadComplete(result.url);
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
        if (isReordering) return;
        setSelectedImageIndex(index);
        setIsGalleryViewerOpen(true);
    };
    
    const currentPhotoCount = profile.galleryImageUrls?.length || 0;
    const canUpload = currentPhotoCount < GALLERY_PHOTO_LIMIT;

    const itemsToShowInGrid = [
        ...(profile.galleryImageUrls || []),
        ...(isOwner && canUpload && currentPhotoCount < PHOTOS_PER_PAGE ? ['uploader'] : [])
    ];
    const pages = [];
    for (let i = 0; i < itemsToShowInGrid.length; i += PHOTOS_PER_PAGE) {
        pages.push(itemsToShowInGrid.slice(i, i + PHOTOS_PER_PAGE));
    }

    const onDragEnd: OnDragEndResponder = (result) => {
        const { source, destination } = result;
        if (!destination) {
            return;
        }

        const items = Array.from(orderedGalleryUrls);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        setOrderedGalleryUrls(items);
    };
    
    const handleSaveReorder = () => {
        startReorderTransition(async () => {
            const result = await updateGalleryOrderAction(profile.userId, orderedGalleryUrls);
            if (result.success) {
                toast({ title: 'Success', description: 'Your gallery order has been saved.' });
                setProfile(prev => ({ ...prev, galleryImageUrls: orderedGalleryUrls }));
                setIsReordering(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    }

    return (
        <>
            <div className="w-full pb-16">
                {/* Cover Photo */}
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
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <Avatar className="h-36 w-36 border-4 border-background ring-2 ring-primary">
                                <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                                <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                        
                        {/* Name and Actions */}
                        <div className="mt-6 md:mt-0 flex-grow flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-3xl font-bold font-headline">{profile.displayName}</h1>
                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Mail className="h-4 w-4" />
                                    {profile.email}
                                </p>
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

                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column (About, Details) */}
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

                        {/* Right Column (Gallery, Reviews) */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader className="flex flex-row justify-between items-center">
                                    <CardTitle>{isReordering ? "Reorder Photos" : `Gallery (${currentPhotoCount}/${GALLERY_PHOTO_LIMIT})`}</CardTitle>
                                     {isOwner && (
                                        <div className="flex items-center gap-2">
                                            {isReordering ? (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => setIsReordering(false)} disabled={isReorderPending}>Cancel</Button>
                                                    <Button size="sm" onClick={handleSaveReorder} disabled={isReorderPending}>
                                                        {isReorderPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Save Order
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    {currentPhotoCount > 1 && <Button variant="outline" size="sm" onClick={() => setIsReordering(true)}>Reorder</Button>}
                                                    {canUpload && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => headerPhotoInputRef.current?.click()}
                                                                disabled={isPhotoUpdatePending}
                                                            >
                                                                {isPhotoUpdatePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                                                Upload
                                                            </Button>
                                                            <input
                                                                type="file"
                                                                ref={headerPhotoInputRef}
                                                                className="sr-only"
                                                                accept="image/*"
                                                                onChange={handleHeaderPhotoUpload}
                                                                disabled={isPhotoUpdatePending}
                                                            />
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {isReordering ? (
                                        <DragDropContext onDragEnd={onDragEnd}>
                                            <StrictModeDroppable droppableId="gallery-reorder">
                                                {(provided) => (
                                                    <div 
                                                        {...provided.droppableProps} 
                                                        ref={provided.innerRef} 
                                                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
                                                    >
                                                        {orderedGalleryUrls.map((url, index) => (
                                                            <Draggable key={url} draggableId={url} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        style={provided.draggableProps.style}
                                                                        className={cn(snapshot.isDragging && "shadow-2xl z-50", "relative group aspect-square rounded-lg overflow-hidden")}
                                                                    >
                                                                        <Image src={url} alt={`Gallery image ${index + 1}`} fill className="object-cover" data-ai-hint="production photo" unoptimized />
                                                                        <div {...provided.dragHandleProps} className="absolute top-2 right-2 p-1.5 bg-black/40 text-white/80 rounded-md cursor-grab active:cursor-grabbing hover:bg-black/60 transition-colors">
                                                                            <GripVertical className="h-5 w-5" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </StrictModeDroppable>
                                        </DragDropContext>
                                    ) : itemsToShowInGrid.length === 0 ? (
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
                                        <Carousel opts={{ align: "start" }} className="w-full relative px-10">
                                            <CarouselContent>
                                                {pages.map((pageItems, pageIndex) => (
                                                    <CarouselItem key={pageIndex}>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            {pageItems.map((item, itemIndex) => {
                                                                if (item === 'uploader') {
                                                                    return <PhotoUploader key="uploader" userId={profile.userId} onUploadComplete={handlePhotoUploadComplete} isGridItem={true} limit={GALLERY_PHOTO_LIMIT} currentCount={currentPhotoCount} />;
                                                                }
                                                                const originalImageIndex = pageIndex * PHOTOS_PER_PAGE + itemIndex;
                                                                return (
                                                                    <div 
                                                                        key={item} 
                                                                        className="aspect-square relative rounded-lg overflow-hidden cursor-pointer group"
                                                                        onClick={() => handleOpenGallery(originalImageIndex)}
                                                                    >
                                                                        <Image 
                                                                            src={item} 
                                                                            alt={`Gallery image ${originalImageIndex + 1}`} 
                                                                            fill 
                                                                            className="object-cover transition-colors duration-300 group-hover:brightness-90"
                                                                            data-ai-hint="production photo" 
                                                                            unoptimized
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            {pages.length > 1 && (
                                                <>
                                                    <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10" />
                                                    <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10" />
                                                </>
                                            )}
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
            {profile.galleryImageUrls && profile.galleryImageUrls.length > 0 && (
                <GalleryViewer
                    isOpen={isGalleryViewerOpen}
                    onClose={() => setIsGalleryViewerOpen(false)}
                    images={profile.galleryImageUrls}
                    startIndex={selectedImageIndex}
                    userName={profile.displayName}
                />
            )}
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

    
