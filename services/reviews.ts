import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  increment,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Review } from '@/types';

export const addReview = async (
  providerId: string,
  clientId: string,
  clientName: string,
  rating: number,
  comment: string
) => {
  try {
    // Add review to reviews collection
    const reviewData = {
      providerId,
      clientId,
      clientName,
      rating,
      comment,
      createdAt: Timestamp.now(),
    };
    
    await addDoc(collection(db, 'reviews'), reviewData);
    
    // Update provider's rating and review count
    const providerRef = doc(db, 'users', providerId);
    const providerDoc = await getDoc(providerRef);
    
    if (providerDoc.exists()) {
      const currentData = providerDoc.data();
      const currentRating = currentData.rating || 0;
      const currentCount = currentData.reviewCount || 0;
      
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + rating) / newCount;
      
      await updateDoc(providerRef, {
        rating: Math.round(newRating * 10) / 10, // Round to 1 decimal
        reviewCount: newCount,
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

export const getProviderReviews = async (providerId: string): Promise<Review[]> => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        providerId: data.providerId,
        clientId: data.clientId,
        clientName: data.clientName,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt.toDate(),
      });
    });
    
    return reviews;
  } catch (error) {
    console.error('Error getting reviews:', error);
    return [];
  }
};

export const getUserReviews = async (clientId: string): Promise<Review[]> => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        providerId: data.providerId,
        clientId: data.clientId,
        clientName: data.clientName,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt.toDate(),
      });
    });
    
    return reviews;
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return [];
  }
};