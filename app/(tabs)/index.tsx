import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Search, MapPin, Users, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/services/firebase';
import { MapView } from '@/components/MapView';
import { SearchFilters } from '@/components/SearchFilters';
import { ProviderCard } from '@/components/ProviderCard';
import { Provider } from '@/types';
import { calculateDistance, getCurrentLocation } from '@/services/location';
import { useAuth } from '@/contexts/AuthContext';

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
    await loadProviders();
    setRefreshing(false);
  };

  const handleProviderPress = (provider: Provider) => {
    // Navigate to provider details or chat
    console.log('Provider selected:', provider.displayName);
  };

  return (
    <View style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Serviço Fácil</Text>
        <Text style={styles.appSubtitle}>Encontre prestadores</Text>
        
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
        <MapView providers={filteredProviders} onProviderSelect={handleProviderPress} />
        
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
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={provider.uid}
              provider={provider}
              onPress={() => handleProviderPress(provider)}
              showDistance={true}
              showChatButton={true}
              onChatPress={() => handleStartChat(provider)}
              showReviewButton={true}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const handleStartChat = async (provider: Provider) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      const chatId = await createOrGetChat(
        user.uid,
        provider.uid,
        user.displayName || 'Usuário',
        provider.displayName
      );
      
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };
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
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
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
});