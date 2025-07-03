

'use server';

import { revalidatePath } from 'next/cache';
import { addEvent, eventExists, addNewsArticle } from '@/lib/data';
import { adminDb, admin } from '@/lib/firebase-admin';
import type { Event, EventOccurrence, NewsArticle, Review, Venue, UserProfile } from '@/lib/types';
import { scrapeEventDetails } from '@/ai/flows/scrape-event-details';
import { scrapeArticle } from '@/ai/flows/scrape-article';


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
    // Sanitize data: Firestore throws an error if any field value is `undefined`.
    // We create a new object and only add fields that have a defined value.
    const cleanData: { [key: string]: any } = {};
    for (const key in data) {
      if (data[key as keyof EventFormData] !== undefined) {
        cleanData[key] = data[key as keyof EventFormData];
      }
    }
    // Ensure description and URL are at least an empty string if they're not provided
    cleanData.description = cleanData.description || '';
    cleanData.url = cleanData.url || '';


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
            order: 0, // Default order, will be updated if needed
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
                // User has already voted, we don't return an error message to the UI
                // to avoid letting them know they can't vote again. Just do nothing.
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

export async function updateUserProfileAction(userId: string, data: Partial<UserProfile>) {
    try {
        // Sanitize data to prevent `undefined` values being sent to Firestore
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined)
        );
        
        await adminDb.collection('userProfiles').doc(userId).update(cleanData);

        // Revalidate paths where this profile might be displayed
        revalidatePath(`/profile/${userId}`);
        revalidatePath('/reviews');
        revalidatePath('/calendar');
        
        return { success: true, message: 'Profile updated successfully.' };
    } catch (error) {
        console.error('Failed to update user profile:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function uploadProfilePhotoAction(formData: FormData) {
    const file = formData.get('photo') as File;
    const userId = formData.get('userId') as string;
    const GALLERY_PHOTO_LIMIT = 50;

    if (!file || !userId) {
        return { success: false, message: 'Missing file or user ID.' };
    }

    const profileRef = adminDb.collection('userProfiles').doc(userId);

    try {
        let currentUrls: string[] = [];
        const doc = await profileRef.get();
        if (doc.exists) {
            const profileData = doc.data() as UserProfile | undefined;
            currentUrls = profileData?.galleryImageUrls || [];
            if (currentUrls.length >= GALLERY_PHOTO_LIMIT) {
                return { success: false, message: `You have reached the photo limit of ${GALLERY_PHOTO_LIMIT}.` };
            }
        }
        
        const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!storageBucketName) {
            throw new Error("FIREBASE_STORAGE_BUCKET environment variable not set.");
        }

        const bucket = admin.storage().bucket(storageBucketName);
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${userId}/${Date.now()}-${file.name}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(buffer, { metadata: { contentType: file.type } });
        await fileUpload.makePublic();
        const publicUrl = fileUpload.publicUrl();

        const newUrls = [...currentUrls, publicUrl];
        await profileRef.set({ galleryImageUrls: newUrls }, { merge: true });

        revalidatePath(`/profile/${userId}`);

        return { success: true };

    } catch (error) {
        console.error('Failed to upload photo:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Upload failed: ${errorMessage}` };
    }
}


export async function uploadCoverPhotoAction(formData: FormData) {
    const file = formData.get('photo') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
        return { success: false, message: 'Missing file or user ID.' };
    }

    try {
        const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
         if (!storageBucketName) {
            throw new Error("FIREBASE_STORAGE_BUCKET environment variable not set.");
        }

        const bucket = admin.storage().bucket(storageBucketName);
        const buffer = Buffer.from(await file.arrayBuffer());
        
        const fileName = `covers/${userId}/cover-${Date.now()}.${file.name.split('.').pop()}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        await fileUpload.makePublic();
        const publicUrl = fileUpload.publicUrl();

        const profileRef = adminDb.collection('userProfiles').doc(userId);
        await profileRef.update({
            coverPhotoUrl: publicUrl,
        });

        revalidatePath(`/profile/${userId}`);

        return { success: true };
    } catch (error) {
        console.error('Failed to upload cover photo:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Upload failed: ${errorMessage}` };
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

export async function deleteProfilePhotoAction(userId: string, photoUrl:string) {
    try {
        const profileRef = adminDb.collection('userProfiles').doc(userId);
        
        await profileRef.update({
            galleryImageUrls: admin.firestore.FieldValue.arrayRemove(photoUrl),
        });

        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            throw new Error('Storage bucket name is not configured on the server.');
        }

        const urlPrefix = `https://storage.googleapis.com/${bucketName}/`;
        if (photoUrl.startsWith(urlPrefix)) {
            const filePath = decodeURIComponent(photoUrl.substring(urlPrefix.length));
            const bucket = admin.storage().bucket(bucketName);
            await bucket.file(filePath).delete();
        } else {
            console.warn(`Could not delete file from storage: URL format not recognized. URL: ${photoUrl}`);
        }

        revalidatePath(`/profile/${userId}`);
        return { success: true, message: 'Photo deleted successfully.' };

    } catch (error) {
        console.error('Failed to delete photo:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}
