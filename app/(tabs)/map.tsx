import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Settings, Search } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/services/firebase';
import { MapView } from '@/components/MapView';
import { ProviderCard } from '@/components/ProviderCard';
import { NotificationButton } from '@/components/NotificationButton';
import { ProviderCardSkeleton } from '@/components/SkeletonLoader';
import { Provider } from '@/types';
import { calculateDistance, getCurrentLocation } from '@/services/location';
import { createOrGetChat } from '@/services/chat';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get('window');

export default function MapScreen() {
  const { user, userProfile } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getCurrentLocation().then(setUserLocation);
    loadSearchRadius();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadProviders();
    }
  }, [userLocation, searchRadius]);

  const loadSearchRadius = async () => {
    try {
      const savedRadius = await AsyncStorage.getItem('searchRadius');
      if (savedRadius) {
        setSearchRadius(parseInt(savedRadius));
      }
    } catch (error) {
      console.error('Error loading search radius:', error);
    }
  };

  const loadProviders = async () => {
    try {
      setLoading(true);
      const providersRef = collection(db, 'users');
      const q = query(
        providersRef,
        where('userType', '==', 'prestador'),
        where('isProfileComplete', '==', true),
      );
      
      const querySnapshot = await getDocs(q);
      const providersData: Provider[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Skip if required fields are missing
        if (!data.displayName || !data.serviceType || !data.neighborhood || !data.latitude || !data.longitude) {
          return;
        }
        
        const provider: Provider = {
          uid: data.uid,
          displayName: data.displayName,
          photoURL: data.photoURL || null,
          serviceType: data.serviceType,
          neighborhood: data.neighborhood,
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          status: data.status || 'disponivel',
          latitude: data.latitude,
          longitude: data.longitude,
        };
        
        // Calculate distance if user location is available
        if (userLocation) {
          provider.distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            provider.latitude,
            provider.longitude
          );
          
          // Only include providers within search radius
          if (provider.distance <= searchRadius) {
            providersData.push(provider);
          }
        } else {
          providersData.push(provider);
        }
      });
      
      // Sort by distance (closest first)
      providersData.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setProviders(providersData);
    } catch (error) {
      console.error('Error loading providers:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Falha ao carregar prestadores'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    router.push(`/provider/${provider.uid}`);
  };

  const handleStartChat = async (provider: Provider) => {
    if (!user || !userProfile) {
      router.push('/auth');
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

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation().then(setUserLocation);
    await loadProviders();
    setRefreshing(false);
  };
  return (
    <View style={styles.container}>
      {/* Header with Settings */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mapa de Prestadores</Text>
          <View style={styles.headerActions}>
            <NotificationButton />
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Settings size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView 
          providers={providers} 
          onProviderSelect={handleProviderSelect}
          userLocation={userLocation}
          loading={loading}
        />
      </View>
      
      <View style={styles.providersContainer}>
        <Text style={styles.providersTitle}>
          Prestadores próximos ({providers.length})
        </Text>
        <ScrollView 
          style={styles.providersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            // Show skeleton loaders while loading
            Array.from({ length: 3 }).map((_, index) => (
              <ProviderCardSkeleton key={index} />
            ))
          ) : (
            providers.map((provider) => (
              <ProviderCard
                key={provider.uid}
                provider={provider}
                onPress={() => handleProviderSelect(provider)}
                showDistance={true}
                showChatButton={true}
                onChatPress={() => handleStartChat(provider)}
              />
            ))
          )}
          
          {!loading && providers.length === 0 && (
            <View style={styles.emptyState}>
              <Search size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>
                Nenhum prestador encontrado em um raio de {searchRadius}km
              </Text>
              <Text style={styles.emptyText}>
                Tente aumentar o raio de busca nas configurações
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  settingsButton: {
    padding: 8,
  },
  mapContainer: {
    height: height * 0.4,
  },
  providersContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
  },
  providersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  providersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});