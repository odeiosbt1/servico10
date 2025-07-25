import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Image, Alert, Platform, ActivityIndicator } from 'react-native';
import { Provider } from '@/types';
import { getCurrentLocation } from '@/services/location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { createOrGetChat } from '@/services/chat';
import { router } from 'expo-router';
import { MapPin, Navigation } from 'lucide-react-native';
import { SkeletonLoader, MapSkeleton } from '@/components/SkeletonLoader';
import Toast from 'react-native-toast-message';

// Only import react-native-maps on native platforms
let RNMapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const MapModule = require('react-native-maps');
    RNMapView = MapModule.default;
    Marker = MapModule.Marker;
    PROVIDER_GOOGLE = MapModule.PROVIDER_GOOGLE;
  } catch (error) {
    console.log('react-native-maps not available');
  }
}

interface MapViewProps {
  providers: Provider[];
  onProviderSelect?: (provider: Provider) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  loading?: boolean;
}

const { width, height } = Dimensions.get('window');

// Web-compatible map component
const WebMapComponent: React.FC<MapViewProps> = ({ providers, onProviderSelect, loading = false }) => {
  const { user, userProfile } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  const handleProviderPress = (provider: Provider) => {
    setSelectedProvider(provider);
    onProviderSelect?.(provider);
    
    // Navigate to provider profile
    router.push(`/provider/${provider.uid}`);
  };

  const handleStartChat = async (provider: Provider) => {
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
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Falha ao iniciar conversa'
      });
    }
  };

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading || mapLoading) {
    return <MapSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Web Map Placeholder */}
      <View style={styles.webMapContainer}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/2422915/pexels-photo-2422915.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop' }}
          style={styles.webMapImage}
        />
        <View style={styles.webMapOverlay}>
          <Navigation size={32} color="white" />
          <Text style={styles.webMapTitle}>Mapa de Prestadores</Text>
          <Text style={styles.webMapSubtitle}>
            {providers.length} prestadores encontrados na região
          </Text>
          <TouchableOpacity style={styles.webMapButton}>
            <Text style={styles.webMapButtonText}>Ver no Mapa Completo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Provider Info Card */}
      {selectedProvider && (
        <View style={styles.providerCard}>
          <View style={styles.providerHeader}>
            <Image
              source={{
                uri: selectedProvider.photoURL || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
              }}
              style={styles.providerAvatar}
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{selectedProvider.displayName}</Text>
              <Text style={styles.providerService}>{selectedProvider.serviceType}</Text>
              <Text style={styles.providerNeighborhood}>{selectedProvider.neighborhood}</Text>
              {selectedProvider.distance && (
                <Text style={styles.providerDistance}>{selectedProvider.distance}km de distância</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedProvider(null)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleStartChat(selectedProvider)}
          >
            <Text style={styles.chatButtonText}>Iniciar Conversa</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Providers List for Web */}
      <View style={styles.webProvidersList}>
        {providers.slice(0, 3).map((provider) => (
          <TouchableOpacity
            key={provider.uid}
            style={styles.webProviderItem}
            onPress={() => handleProviderPress(provider)}
          >
            <Image
              source={{
                uri: provider.photoURL || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop'
              }}
              style={styles.webProviderAvatar}
            />
            <View style={styles.webProviderInfo}>
              <Text style={styles.webProviderName}>{provider.displayName}</Text>
              <Text style={styles.webProviderService}>{provider.serviceType}</Text>
            </View>
            <View style={[styles.webStatusDot, { 
              backgroundColor: provider.status === 'disponivel' ? '#22c55e' : '#ef4444' 
            }]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Native map component
const NativeMapComponent: React.FC<MapViewProps> = ({ providers, onProviderSelect, userLocation, loading = false }) => {
  const { user, userProfile } = useAuth();
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    loadSearchRadius();
  }, []);

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

  const handleMarkerPress = (provider: Provider) => {
    setSelectedProvider(provider);
    onProviderSelect?.(provider);
    
    // Navigate to provider profile after a short delay
    setTimeout(() => {
      router.push(`/provider/${provider.uid}`);
    }, 500);
  };

  const handleStartChat = async (provider: Provider) => {
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
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Falha ao iniciar conversa'
      });
    }
  };

  const defaultRegion = {
    latitude: userLocation?.latitude || -22.9068,
    longitude: userLocation?.longitude || -43.1729,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (!RNMapView) {
    return <WebMapComponent providers={providers} onProviderSelect={onProviderSelect} loading={loading} />;
  }

  if (loading) {
    return <MapSkeleton />;
  }

  return (
    <View style={styles.container}>
      {!mapReady && (
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.mapLoadingText}>Carregando mapa...</Text>
        </View>
      )}
      <RNMapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={true}
        loadingEnabled={true}
        mapType="standard"
        onMapReady={() => setMapReady(true)}
      >
        {providers.map((provider) => (
          <Marker
            key={provider.uid}
            coordinate={{
              latitude: provider.latitude,
              longitude: provider.longitude,
            }}
            onPress={() => handleMarkerPress(provider)}
          >
            <View style={styles.customMarker}>
              <Image
                source={{
                  uri: provider.photoURL || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
                }}
                style={styles.markerImage}
              />
              <View style={[styles.statusIndicator, { 
                backgroundColor: provider.status === 'disponivel' ? '#22c55e' : '#ef4444' 
              }]} />
            </View>
          </Marker>
        ))}
      </RNMapView>

      {/* Provider Info Card */}
      {selectedProvider && (
        <View style={styles.providerCard}>
          <View style={styles.providerHeader}>
            <Image
              source={{
                uri: selectedProvider.photoURL || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
              }}
              style={styles.providerAvatar}
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{selectedProvider.displayName}</Text>
              <Text style={styles.providerService}>{selectedProvider.serviceType}</Text>
              <Text style={styles.providerNeighborhood}>{selectedProvider.neighborhood}</Text>
              {selectedProvider.distance && (
                <Text style={styles.providerDistance}>{selectedProvider.distance}km de distância</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedProvider(null)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleStartChat(selectedProvider)}
          >
            <Text style={styles.chatButtonText}>Iniciar Conversa</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map Info */}
      <View style={styles.mapInfo}>
        <Text style={styles.mapInfoText}>
          {providers.length} prestadores em {searchRadius}km
        </Text>
      </View>
    </View>
  );
};

export const MapView: React.FC<MapViewProps> = (props) => {
  if (Platform.OS === 'web' || !RNMapView) {
    return <WebMapComponent {...props} />;
  }
  return <NativeMapComponent {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  webMapContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    margin: 16,
  },
  webMapImage: {
    width: '100%',
    height: '100%',
  },
  webMapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webMapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  webMapSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  webMapButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  webMapButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  webProvidersList: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  webProviderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  webProviderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  webProviderInfo: {
    flex: 1,
  },
  webProviderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  webProviderService: {
    fontSize: 12,
    color: '#2563eb',
  },
  webStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  providerCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  providerService: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 2,
  },
  providerNeighborhood: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  providerDistance: {
    fontSize: 12,
    color: '#94a3b8',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: 'bold',
  },
  chatButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mapInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapInfoText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
});