

'use server';

import { revalidatePath } from 'next/cache';
import { addEvent, eventExists, addNewsArticle, getReviewsByUserId, getOrCreateUserProfile } from '@/lib/data';
import { adminDb, admin } from '@/lib/firebase-admin';
import type { Event, EventOccurrence, NewsArticle, Review, Venue, UserProfile } from '@/lib/types';
import { scrapeEventDetails } from '@/ai/flows/scrape-event-details';
import { scrapeArticle } from '@/ai/flows/scrape-article';
import { headers } from 'next/headers';


export async function revalidateAdminPaths() {
  revalidatePath('/admin');
  revalidatePath('/calendar');
  revalidatePath('/');
  revalidatePath('/about-us');
}

export async function scrapeEventAction(url: string | undefined, screenshotDataUri: string) {
  try {
    const scrapedData = await scrapeEventDetails({ url, screenshotDataUri });
    return { success: true, data: { ...scrapedData, sourceUrl: url } };
  } catch (error) {
    console.error('Scraping failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `An unexpected error occurred while scraping the event details. Error: ${errorMessage}` };
  }
}

interface EventFormData {
  title: string;
  description?: string;
  url?: string;
  venueId: string;
  type: string;
  tags?: string[];
  occurrences: EventOccurrence[];
}

export async function addEventFromFormAction(data: EventFormData) {
  try {
    const { title, venueId } = data;
    const alreadyExists = await eventExists(title, venueId);
    if (alreadyExists) {
        return { success: false, message: `This event ("${title}") already exists in the system for this venue.` };
    }

    const newEvent: Omit<Event, 'id'> = {
      ...data,
      description: data.description || '',
      tags: data.tags || [],
      status: 'approved',
    };

    await addEvent(newEvent);
    await revalidateAdminPaths();
    return { success: true, message: 'Event added and approved successfully.' };

  } catch (error) {
    console.error('Failed to add event:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
  }
}


export async function updateEventAction(eventId: string, data: EventFormData) {
  try {
    const cleanData: { [key: string]: any } = {};
    for (const key in data) {
      if (data[key as keyof EventFormData] !== undefined) {
        cleanData[key] = data[key as keyof EventFormData];
      }
    }
    cleanData.description = cleanData.description || '';
    cleanData.url = cleanData.url || '';
    cleanData.tags = cleanData.tags || [];


    const eventRef = adminDb.collection('events').doc(eventId);
    await eventRef.update(cleanData);

    await revalidateAdminPaths();
    return { success: true, message: 'Event updated successfully.' };
  } catch (error) {
    console.error('Failed to update event:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
  }
}

export async function updateEventStatusAction(eventId: string, status: 'approved' | 'denied') {
    try {
        const eventRef = adminDb.collection('events').doc(eventId);
        await eventRef.update({ status });
        await revalidateAdminPaths();
        return { success: true, message: `Event status updated to ${status}.` };
    } catch (error) {
        console.error('Failed to update event status:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function deleteEventAction(eventId: string) {
    try {
        await adminDb.collection('events').doc(eventId).delete();
        await revalidateAdminPaths();
        return { success: true, message: 'Event deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete event:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function updateVenueAction(venueId: string, data: Partial<Omit<Venue, 'id'>>) {
    try {
        await adminDb.collection('venues').doc(venueId).update(data);
        await revalidateAdminPaths();
        return { success: true, message: 'Venue updated successfully.' };
    } catch (error) {
        console.error('Failed to update venue:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function deleteVenueAction(venueId: string) {
    try {
        await adminDb.collection('venues').doc(venueId).delete();
        await revalidateAdminPaths();
        return { success: true, message: 'Venue deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete venue:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function scrapeArticleAction(url: string) {
    try {
        const articleData = await scrapeArticle({ url });

        if (!articleData.title || !articleData.summary) {
            return { success: false, message: 'The AI could not extract a title and summary from the article.' };
        }
        
        return { success: true, data: { ...articleData, url } };

    } catch (error) {
        console.error('Failed to scrape article:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

interface ArticleFormData {
  url: string;
  title: string;
  summary: string;
  imageUrl?: string;
}

export async function saveNewsArticleAction(data: ArticleFormData) {
    try {
        const newArticleData = {
            ...data,
            createdAt: new Date().toISOString(),
            order: 0, 
        };

        const newsCollection = adminDb.collection('news');
        const snapshot = await newsCollection.orderBy('order', 'desc').limit(1).get();
        if (!snapshot.empty) {
            const lastArticle = snapshot.docs[0].data();
            newArticleData.order = (lastArticle.order || 0) + 1;
        }

        await addNewsArticle(newArticleData as Omit<NewsArticle, 'id'>);
        revalidatePath('/news');
        return { success: true, message: 'Article added successfully.' };
    } catch (error) {
        console.error('Failed to add news article:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function updateNewsArticleOrderAction(orderedArticleIds: string[]) {
    try {
        const batch = adminDb.batch();
        const newsCollection = adminDb.collection('news');

        orderedArticleIds.forEach((id, index) => {
            const docRef = newsCollection.doc(id);
            batch.update(docRef, { order: index });
        });

        await batch.commit();
        revalidatePath('/news');
        return { success: true, message: 'Article order updated.' };
    } catch (error) {
        console.error('Failed to update article order:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function addListingRequestAction(data: {
    organizationName: string;
    contactName: string;
    contactEmail: string;
    websiteUrl?: string;
    message?: string;
}) {
    try {
        const requestData = {
            ...data,
            status: 'new',
            createdAt: new Date().toISOString(),
        };

        await adminDb.collection('listingRequests').add(requestData);
        
        return { success: true, message: 'Request submitted successfully.' };

    } catch (error) {
        console.error('Failed to submit listing request:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function submitReviewAction(data: Omit<Review, 'id' | 'createdAt' | 'likes' | 'dislikes' | 'votedBy'>) {
    try {
        const reviewData = {
            ...data,
            likes: 0,
            dislikes: 0,
            votedBy: [],
            createdAt: new Date().toISOString(),
        };

        await adminDb.collection('reviews').add(reviewData);

        revalidatePath('/calendar');
        revalidatePath('/reviews');
        revalidatePath(`/profile/${data.reviewerId}`);
        return { success: true, message: 'Your review has been submitted. Thank you!' };
    } catch (error) {
        console.error('Failed to submit review:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function voteOnReviewAction(reviewId: string, voteType: 'like' | 'dislike', userId: string) {
    if (!userId) {
        return { success: false, message: 'You must be logged in to vote.' };
    }

    const reviewRef = adminDb.collection('reviews').doc(reviewId);

    try {
        await adminDb.runTransaction(async (transaction) => {
            const reviewDoc = await transaction.get(reviewRef);
            if (!reviewDoc.exists) {
                throw new Error("Review not found.");
            }

            const reviewData = reviewDoc.data() as Review;
            
            if (reviewData.votedBy?.includes(userId)) {
                return;
            }

            const newVotedBy = [...(reviewData.votedBy || []), userId];
            const newLikes = voteType === 'like' ? (reviewData.likes || 0) + 1 : (reviewData.likes || 0);
            const newDislikes = voteType === 'dislike' ? (reviewData.dislikes || 0) + 1 : (reviewData.dislikes || 0);

            transaction.update(reviewRef, {
                likes: newLikes,
                dislikes: newDislikes,
                votedBy: newVotedBy,
            });
        });
        
        revalidatePath('/calendar');
        revalidatePath('/reviews');
        return { success: true };

    } catch (error) {
        console.error('Failed to vote on review:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function requestToBeReviewerAction(data: {
    userId: string;
    userName: string;
    userEmail: string;
}) {
    try {
        const requestData = {
            ...data,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await adminDb.collection('reviewerRequests').add(requestData);
        
        return { success: true, message: 'Request submitted successfully.' };

    } catch (error) {
        console.error('Failed to submit reviewer request:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}


// --- User Profile Actions ---

export async function getFullProfileAction(userId: string): Promise<{ success: boolean; data?: UserProfile, message?: string;}> {
    try {
        const profile = await getOrCreateUserProfile(userId);
        if (!profile) {
            return { success: false, message: 'Profile not found.' };
        }
        return { success: true, data: profile };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred: ${errorMessage}` };
    }
}

export async function getReviewsForUserAction(userId: string): Promise<{ success: boolean; data?: Review[], message?: string;}> {
    try {
        const reviews = await getReviewsByUserId(userId);
        return { success: true, data: reviews };
    } catch (error) {
        console.error(`Failed to fetch reviews for user ${userId}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred: ${errorMessage}` };
    }
}

export async function updateUserProfileAction(userId: string, data: Partial<UserProfile>) {
    try {
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined)
        );
        
        await adminDb.collection('userProfiles').doc(userId).update(cleanData);
        
        revalidatePath(`/profile/${userId}`);
        return { success: true, message: 'Profile updated successfully.' };
    } catch (error) {
        console.error('Failed to update user profile:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function generateUploadUrlAction(userId: string, fileName: string, fileType: string) {
    try {
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            return { success: false, message: 'Storage destination not found. The server configuration for the storage bucket is missing or incorrect.' };
        }

        const bucket = admin.storage().bucket(bucketName);
        const filePath = `${userId}/${Date.now()}-${fileName}`;
        const file = bucket.file(filePath);
        
        const options = {
            version: 'v4' as const,
            action: 'write' as const,
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: fileType,
        };
        
        const [uploadUrl] = await file.getSignedUrl(options);
        
        return { success: true, data: { uploadUrl, filePath } };
    } catch (error) {
        console.error('Failed to generate signed URL:', error);
        if (error instanceof Error && error.message.includes('Could not determine Storage bucket name.')) {
            return { success: false, message: 'Storage destination not found. The server configuration for the storage bucket is missing or incorrect.' };
        }
        return { success: false, message: 'Could not create upload URL.' };
    }
}

export async function savePhotoUrlAction(userId: string, filePath: string) {
    const GALLERY_PHOTO_LIMIT = 50;
    const profileRef = adminDb.collection('userProfiles').doc(userId);

    try {
        const docSnap = await profileRef.get();
        if (docSnap.exists) {
            const profileData = docSnap.data() as UserProfile;
            if ((profileData.galleryImageUrls?.length || 0) >= GALLERY_PHOTO_LIMIT) {
                return { success: false, message: `You have reached the photo limit of ${GALLERY_PHOTO_LIMIT}.` };
            }
        }

        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            throw new Error("Firebase Storage bucket name is not configured on the server.");
        }
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(filePath);
        
        await file.makePublic();
        
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

        await profileRef.update({
            galleryImageUrls: admin.firestore.FieldValue.arrayUnion(publicUrl),
        });

        revalidatePath(`/profile/${userId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to save photo URL:', error);
        return { success: false, message: 'Could not save photo to profile.' };
    }
}


export async function updateGalleryOrderAction(userId: string, orderedUrls: string[]) {
    try {
        const profileRef = adminDb.collection('userProfiles').doc(userId);
        await profileRef.update({
            galleryImageUrls: orderedUrls,
        });

        revalidatePath(`/profile/${userId}`);
        return { success: true, message: 'Gallery order updated successfully.' };
    } catch (error) {
        console.error('Failed to update gallery order:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function deleteProfilePhotoAction(userId: string, photoUrl: string) {
    try {
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            throw new Error("Firebase Storage bucket name is not configured on the server.");
        }
        const bucket = admin.storage().bucket(bucketName);
        
        const decodedUrl = decodeURIComponent(photoUrl);
        const pathRegex = new RegExp(`/b/${bucket.name}/o/(.+)`);
        const match = new URL(decodedUrl).pathname.match(pathRegex);

        if (!match || !match[1]) {
            throw new Error(`Could not parse file path from URL: ${decodedUrl}`);
        }
        const filePath = match[1].split('?')[0]; // Remove query params like ?alt=media
        
        if (!filePath || !filePath.startsWith(`${userId}/`)) {
            throw new Error(`Invalid file path for deletion: ${filePath}`);
        }

        const file = bucket.file(filePath);

        await file.delete().catch(error => {
            if (error.code !== 404) {
                console.warn(`Firebase Storage deletion warning: ${error.message}`);
            }
        });

        const profileRef = adminDb.collection('userProfiles').doc(userId);
        await adminDb.runTransaction(async (transaction) => {
            const freshDoc = await transaction.get(profileRef);
            if (!freshDoc.exists) return; 

            const freshData = freshDoc.data() as UserProfile;
            const updates: { [key: string]: any } = {
                galleryImageUrls: admin.firestore.FieldValue.arrayRemove(photoUrl),
            };

            if (freshData.coverPhotoUrl === photoUrl) {
                updates.coverPhotoUrl = '';
            }
            if (freshData.photoURL === photoUrl) {
                try {
                    const userRecord = await admin.auth().getUser(userId);
                    updates.photoURL = userRecord.photoURL || '';
                } catch (authError) {
                    console.warn(`Could not find auth user ${userId} when deleting photo. Setting photoURL to empty.`)
                    updates.photoURL = '';
                }
            }
            transaction.update(profileRef, updates);
        });

        revalidatePath(`/profile/${userId}`);
        return { success: true, message: 'Photo deleted successfully.' };

    } catch (error) {
        console.error('Failed to delete photo:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}


export async function setProfilePhotoAction(userId: string, photoUrl: string) {
    try {
        const profileRef = adminDb.collection('userProfiles').doc(userId);
        await profileRef.set({ photoURL: photoUrl }, { merge: true });

        revalidatePath(`/profile/${userId}`);
        return { success: true, message: 'Profile photo updated successfully.' };
    } catch (error) {
        console.error('Failed to set profile photo:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function setCoverPhotoAction(userId: string, photoUrl: string) {
    try {
        const profileRef = adminDb.collection('userProfiles').doc(userId);
        await profileRef.set({ coverPhotoUrl: photoUrl }, { merge: true });

        revalidatePath(`/profile/${userId}`);
        return { success: true, message: 'Cover photo updated successfully.' };
    } catch (error) {
        console.error('Failed to set cover photo:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}


export async function deleteMyProfileAction() {
    const authorization = headers().get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return { success: false, message: 'User not authenticated.' };
    }
    const idToken = authorization.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        
        await adminDb.collection('userProfiles').doc(userId).delete();
        
        admin.auth().deleteUser(userId).catch(err => {
            console.warn(`Could not delete auth user ${userId} during profile deletion. This can be normal if the auth record was already gone.`, err.code);
        });

        revalidatePath(`/profile/${userId}`);
        revalidatePath('/admin');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to delete user profile:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function migrateOrphanedProfileAction(orphanedProfileId: string) {
    const authorization = headers().get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return { success: false, message: 'User not authenticated.' };
    }
    const idToken = authorization.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const newUserId = decodedToken.uid;
        const newUserEmail = decodedToken.email;

        if (!newUserEmail) {
            return { success: false, message: 'Your new account does not have an email address associated with it.' };
        }
        
        const oldProfileRef = adminDb.collection('userProfiles').doc(orphanedProfileId);
        const newProfileRef = adminDb.collection('userProfiles').doc(newUserId);

        const oldProfileSnap = await oldProfileRef.get();

        if (!oldProfileSnap.exists) {
            return { success: false, message: 'Orphaned profile not found. It may have already been deleted.' };
        }
        
        const oldProfileData = oldProfileSnap.data() as UserProfile;
        
        if (oldProfileData.email !== newUserEmail) {
            return { success: false, message: 'Email addresses do not match. You can only claim a profile with the same email address.' };
        }
        
        // Data to migrate (we avoid overwriting newer data on the new profile)
        const dataToMigrate = {
            bio: oldProfileData.bio,
            roleInCommunity: oldProfileData.roleInCommunity,
            communityStartDate: oldProfileData.communityStartDate,
            galleryImageUrls: oldProfileData.galleryImageUrls,
            coverPhotoUrl: oldProfileData.coverPhotoUrl,
            showEmail: oldProfileData.showEmail,
        };

        // Create or merge data into the new profile
        await newProfileRef.set(dataToMigrate, { merge: true });

        // Delete the old profile
        await oldProfileRef.delete();

        revalidatePath(`/profile/${newUserId}`);
        revalidatePath(`/profile/${orphanedProfileId}`);
        
        return { success: true, migratedToId: newUserId };

    } catch (error) {
        console.error('Failed to migrate orphaned profile:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred: ${errorMessage}` };
    }
}
