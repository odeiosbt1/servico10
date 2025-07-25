import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, MapPin, MessageCircle, Star as StarIcon } from 'lucide-react-native';
import { Provider } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createOrGetChat } from '@/services/chat';
import { router } from 'expo-router';
import { Alert } from 'react-native';

interface ProviderCardProps {
  provider: Provider;
  onPress?: () => void;
  onChatPress?: () => void;
  showDistance?: boolean;
  showChatButton?: boolean;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ 
  provider, 
  onPress, 
  onChatPress,
  showDistance = true,
  showChatButton = true
}) => {
  const { user, userProfile } = useAuth();

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          color={i <= rating ? '#fbbf24' : '#d1d5db'}
          fill={i <= rating ? '#fbbf24' : 'transparent'}
        />
      );
    }
    return stars;
  };

  const getStatusColor = (status: string) => {
    return status === 'disponivel' ? '#22c55e' : '#ef4444';
  };

  const getStatusText = (status: string) => {
    return status === 'disponivel' ? 'Disponível' : 'Ocupado';
  };

  const handleStartChat = async () => {
    if (!user || !userProfile) {
      Alert.alert(
        'Login Necessário',
        'Você precisa fazer login para iniciar uma conversa.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Login', onPress: () => router.push('/auth') },
        ]
      );
      return;
    }

    try {
      const chatId = await createOrGetChat(
        user.uid,
        provider.uid,
        userProfile.displayName,
        provider.displayName
      );
      
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Erro', 'Falha ao iniciar conversa. Tente novamente.');
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Image
          source={{ 
            uri: provider.photoURL || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
          }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{provider.displayName}</Text>
          <Text style={styles.service}>{provider.serviceType}</Text>
          <View style={styles.location}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.neighborhood}>{provider.neighborhood}</Text>
          </View>
        </View>
        <View style={styles.status}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(provider.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(provider.status) }]}>
            {getStatusText(provider.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.rating}>
          <View style={styles.stars}>
            {renderStars(provider.rating)}
          </View>
          <Text style={styles.ratingText}>
            {provider.rating.toFixed(1)} ({provider.reviewCount} avaliações)
          </Text>
        </View>
        
        {showDistance && provider.distance && (
          <Text style={styles.distance}>{provider.distance}km de distância</Text>
        )}
        
        {showChatButton && (
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={onChatPress || handleStartChat}
          >
            <MessageCircle size={16} color="white" />
            <Text style={styles.chatButtonText}>Conversar</Text>
          </TouchableOpacity>
        )
        }
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  service: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 4,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  neighborhood: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  status: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flex: 1,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748b',
  },
  distance: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  chatButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});