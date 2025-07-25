export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  userType: 'prestador' | 'contratante';
  cpf?: string | null;
  phone?: string | null;
  neighborhood?: string | null;
  serviceType?: string | null;
  isProfileComplete: boolean;
  status?: 'disponivel' | 'ocupado' | null;
  rating?: number | null;
  reviewCount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  icon: string;
}

export interface Provider {
  uid: string;
  displayName: string;
  photoURL?: string;
  serviceType: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  status: 'disponivel' | 'ocupado';
  distance?: number;
  latitude: number;
  longitude: number;
}

export interface Review {
  id: string;
  providerId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage?: string;
  lastMessageTime?: Date;
  providerId: string;
  clientId: string;
}