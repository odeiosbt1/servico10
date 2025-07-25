import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ArrowLeft, Star, MapPin, MessageCircle, Phone, Calendar, Award, Clock } from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { getProviderReviews } from '@/services/reviews';
import { getProviderStats } from '@/services/stats';
import { createOrGetChat } from '@/services/chat';
import { ReviewCard } from '@/components/ReviewCard';
import { ReviewModal } from '@/components/ReviewModal';
import { StatsCard } from '@/components/StatsCard';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Provider, Review, ProviderStats } from '@/types';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, userProfile } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadProviderData();
    }
  }, [id]);

  const loadProviderData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Load provider profile
      const providerRef = doc(db, 'users', id);
      const providerSnap = await getDoc(providerRef);
      
      if (providerSnap.exists()) {
        const providerData = providerSnap.data() as Provider;
        setProvider(providerData);
        
        // Load reviews and stats
        const [reviewsData, statsData] = await Promise.all([
          getProviderReviews(id),
          getProviderStats(id)
        ]);
        
        setReviews(reviewsData);
        setStats(statsData);
      } else {
        Alert.alert('Erro', 'Prestador não encontrado.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Falha ao carregar dados do prestador'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user || !userProfile || !provider) {
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
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Falha ao iniciar conversa'
      });
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    loadProviderData(); // Reload to get updated reviews
    Toast.show({
      type: 'success',
      text1: 'Sucesso',
      text2: 'Avaliação enviada com sucesso!'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={20}
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Carregando...',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color="#2563eb" />
              </TouchableOpacity>
            ),
          }}
        />
        <ScrollView style={styles.content}>
          <View style={styles.headerSkeleton}>
            <SkeletonLoader width={120} height={120} borderRadius={60} />
            <SkeletonLoader width="60%" height={24} style={{ marginTop: 16 }} />
            <SkeletonLoader width="40%" height={18} style={{ marginTop: 8 }} />
            <SkeletonLoader width="50%" height={16} style={{ marginTop: 8 }} />
          </View>
          
          <View style={styles.section}>
            <SkeletonLoader width="40%" height={20} style={{ marginBottom: 16 }} />
            <View style={styles.statsRow}>
              <SkeletonLoader width={(width - 64) / 2} height={80} borderRadius={12} />
              <SkeletonLoader width={(width - 64) / 2} height={80} borderRadius={12} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.container}>
        <Text>Prestador não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: provider.displayName,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#2563eb" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        {/* Provider Header */}
        <View style={styles.header}>
          <Image
            source={{
              uri: provider.photoURL || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{provider.displayName}</Text>
          <Text style={styles.service}>{provider.serviceType}</Text>
          
          <View style={styles.location}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.neighborhood}>{provider.neighborhood}</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(provider.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(provider.status) }]}>
              {getStatusText(provider.status)}
            </Text>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(provider.rating)}
            </View>
            <Text style={styles.ratingText}>
              {provider.rating.toFixed(1)} ({provider.reviewCount} avaliações)
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatsCard
                  icon={<Star size={20} color="#fbbf24" />}
                  title="Avaliações"
                  value={stats.totalReviews}
                  subtitle={`${stats.averageRating} estrelas`}
                  color="#fbbf24"
                />
                <StatsCard
                  icon={<MessageCircle size={20} color="#2563eb" />}
                  title="Conversas"
                  value={stats.totalChats}
                  subtitle="Total de chats"
                  color="#2563eb"
                />
              </View>
              <View style={styles.statsRow}>
                <StatsCard
                  icon={<Award size={20} color="#22c55e" />}
                  title="Serviços"
                  value={stats.completedServices}
                  subtitle="Concluídos"
                  color="#22c55e"
                />
                <StatsCard
                  icon={<Clock size={20} color="#f59e0b" />}
                  title="Resposta"
                  value={stats.responseTime}
                  subtitle="Tempo médio"
                  color="#f59e0b"
                />
              </View>
            </View>
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avaliações ({reviews.length})</Text>
            {user && userProfile && userProfile.userType === 'contratante' && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => setShowReviewModal(true)}
              >
                <Star size={16} color="white" />
                <Text style={styles.reviewButtonText}>Avaliar</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyReviews}>
              <Star size={32} color="#d1d5db" />
              <Text style={styles.emptyReviewsText}>
                Ainda não há avaliações
              </Text>
              <Text style={styles.emptyReviewsSubtext}>
                Seja o primeiro a avaliar este prestador
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.phoneButton}>
          <Phone size={20} color="#2563eb" />
          <Text style={styles.phoneButtonText}>Ligar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={handleStartChat}
        >
          <MessageCircle size={20} color="white" />
          <Text style={styles.chatButtonText}>Conversar</Text>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      {user && userProfile && provider && (
        <ReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          provider={provider}
          clientId={user.uid}
          clientName={userProfile.displayName}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  headerSkeleton: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#e2e8f0',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  service: {
    fontSize: 18,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 12,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  neighborhood: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsGrid: {
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reviewsList: {
    paddingHorizontal: 16,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyReviewsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyReviewsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  phoneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  phoneButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  chatButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});