import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from './firebase';

export interface ProviderStats {
  totalReviews: number;
  averageRating: number;
  totalChats: number;
  completedServices: number;
  responseTime: string;
  joinDate: Date;
}

export const getProviderStats = async (providerId: string): Promise<ProviderStats> => {
  try {
    // Get reviews count and average rating
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(reviewsRef, where('providerId', '==', providerId));
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    let totalRating = 0;
    reviewsSnapshot.forEach((doc) => {
      totalRating += doc.data().rating;
    });
    
    const totalReviews = reviewsSnapshot.size;
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    
    // Get chats count
    const chatsRef = collection(db, 'chats');
    const chatsQuery = query(chatsRef, where('providerId', '==', providerId));
    const chatsSnapshot = await getDocs(chatsQuery);
    const totalChats = chatsSnapshot.size;
    
    // Get user join date
    const userRef = collection(db, 'users');
    const userQuery = query(userRef, where('uid', '==', providerId));
    const userSnapshot = await getDocs(userQuery);
    
    let joinDate = new Date();
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      joinDate = userData.createdAt?.toDate() || new Date();
    }
    
    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalChats,
      completedServices: Math.floor(totalReviews * 1.2), // Estimate based on reviews
      responseTime: '< 2h', // Mock data - would need real implementation
      joinDate,
    };
  } catch (error) {
    console.error('Error getting provider stats:', error);
    return {
      totalReviews: 0,
      averageRating: 0,
      totalChats: 0,
      completedServices: 0,
      responseTime: 'N/A',
      joinDate: new Date(),
    };
  }
};