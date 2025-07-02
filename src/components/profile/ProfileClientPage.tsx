'use client';

import type { UserProfile, Review } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Shield, Drama, Wrench, Users, Camera, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ReviewPreviewCard } from '@/components/reviews/ReviewPreviewCard';
import { EditProfileSheet } from '@/components/profile/EditProfileSheet';

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
                                <CardHeader><CardTitle>Gallery</CardTitle></CardHeader>
                                <CardContent>
                                    {profile.galleryImageUrls && profile.galleryImageUrls.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {profile.galleryImageUrls.map((url, index) => (
                                                <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                                                    <Image src={url} alt={`Gallery image ${index + 1}`} fill className="object-cover" data-ai-hint="production photo" unoptimized/>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                            <Camera className="h-10 w-10 mb-2" />
                                            <p className="font-medium">No Photos Yet</p>
                                            {isOwner && <p className="text-sm">Click "Edit Profile" to add photos to your gallery.</p>}
                                        </div>
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
