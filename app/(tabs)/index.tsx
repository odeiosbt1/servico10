import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Search, MapPin, Users, Star, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/services/firebase';
import { MapView } from '@/components/MapView';
import { SearchFilters } from '@/components/SearchFilters';
import { ProviderCard } from '@/components/ProviderCard';
import { NotificationButton } from '@/components/NotificationButton';
import { ProviderCardSkeleton } from '@/components/SkeletonLoader';
import { Provider } from '@/types';
import { calculateDistance, getCurrentLocation } from '@/services/location';
import { useAuth } from '@/contexts/AuthContext';
import { createOrGetChat } from '@/services/chat';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function HomeScreen() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation().then(setUserLocation);
    loadSearchRadius();
    loadProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [providers, selectedService, selectedNeighborhood, searchText, searchRadius]);

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
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const providersData: Provider[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Skip if required fields are missing
        if (!data.displayName || !data.serviceType || !data.neighborhood) {
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
          latitude: data.latitude || -22.9068,
          longitude: data.longitude || -43.1729,
        };
        
        // Calculate distance if user location is available
        if (userLocation) {
          provider.distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            provider.latitude,
            provider.longitude
          );
        }
        
        providersData.push(provider);
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

  const filterProviders = () => {
    let filtered = [...providers];

    // Filter by service type
    if (selectedService) {
      filtered = filtered.filter(provider => 
        provider.serviceType.toLowerCase().includes(selectedService.toLowerCase())
      );
    }

    // Filter by neighborhood
    if (selectedNeighborhood) {
      filtered = filtered.filter(provider => 
        provider.neighborhood === selectedNeighborhood
      );
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(provider =>
        provider.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
        provider.serviceType.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Only show providers within 5km radius
    if (userLocation) {
      filtered = filtered.filter(provider => (provider.distance || 0) <= searchRadius);
    }

    setFilteredProviders(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation().then(setUserLocation);
    await loadProviders();
    setRefreshing(false);
  };

  const handleProviderPress = (provider: Provider) => {
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

  return (
    <View style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.appTitle}>Serviço Fácil</Text>
            <Text style={styles.appSubtitle}>Encontre prestadores</Text>
          </View>
          <NotificationButton />
        </View>
        
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Users size={16} color="#2563eb" />
            <Text style={styles.statNumber}>{filteredProviders.length}</Text>
            <Text style={styles.statLabel}>Prestadores</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MapPin size={16} color="#2563eb" />
            <Text style={styles.statNumber}>{searchRadius}km</Text>
            <Text style={styles.statLabel}>Raio</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Star size={16} color="#fbbf24" />
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Map Section */}
        <MapView 
          providers={filteredProviders} 
          onProviderSelect={handleProviderPress}
          userLocation={userLocation}
          loading={loading}
        />
        
        {/* Search and Filters */}
        <SearchFilters
          onServiceFilter={setSelectedService}
          onNeighborhoodFilter={setSelectedNeighborhood}
          onSearchText={setSearchText}
          onRadiusChange={(radius) => {
            setSearchRadius(radius);
            loadProviders();
          }}
          selectedService={selectedService}
          selectedNeighborhood={selectedNeighborhood}
          currentRadius={searchRadius}
        />

        {/* Providers List */}
        <View style={styles.providersList}>
          {loading ? (
            // Show skeleton loaders while loading
            Array.from({ length: 3 }).map((_, index) => (
              <ProviderCardSkeleton key={index} />
            ))
          ) : (
            filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.uid}
                provider={provider}
                onPress={() => handleProviderPress(provider)}
                showDistance={true}
                showChatButton={true}
                onChatPress={() => handleStartChat(provider)}
              />
            ))
          )}
          
          {!loading && filteredProviders.length === 0 && (
            <View style={styles.emptyState}>
              <Search size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Nenhum prestador encontrado</Text>
              <Text style={styles.emptyText}>
                Tente ajustar os filtros ou aumentar o raio de busca
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  providersList: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});