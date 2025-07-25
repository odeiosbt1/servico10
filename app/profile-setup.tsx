import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Camera, User, MapPin, Phone, CreditCard, Briefcase, Search } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/services/auth';
import { getCurrentLocation } from '@/services/location';
import { SERVICES, NEIGHBORHOODS } from '@/constants/services';

export default function ProfileSetupScreen() {
  const { userType } = useLocalSearchParams<{ userType?: string }>();
  const { user, userProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [cpf, setCpf] = useState(userProfile?.cpf || '');
  const [neighborhood, setNeighborhood] = useState(userProfile?.neighborhood || '');
  const [serviceType, setServiceType] = useState(userProfile?.serviceType || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [showServices, setShowServices] = useState(false);
  
  // Address states
  const [fullAddress, setFullAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  const handleImageSelection = () => {
    Alert.alert(
      'Selecionar Foto',
      'Escolha uma opção:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Câmera', onPress: takePhoto },
        { text: 'Galeria', onPress: pickImage },
      ]
    );
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return formatted;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    return formatted;
  };

  // Simulated Google Places Autocomplete
  const handleAddressSearch = (text: string) => {
    setFullAddress(text);
    
    if (text.length > 2) {
      // Simulate address suggestions (in real app, use Google Places API)
      const mockSuggestions = [
        `${text}, Copacabana, Rio de Janeiro - RJ`,
        `${text}, Ipanema, Rio de Janeiro - RJ`,
        `${text}, Botafogo, Rio de Janeiro - RJ`,
        `${text}, Tijuca, Rio de Janeiro - RJ`,
        `${text}, Barra da Tijuca, Rio de Janeiro - RJ`,
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(text.toLowerCase())
      );
      
      setAddressSuggestions(mockSuggestions);
      setShowAddressSuggestions(true);
    } else {
      setShowAddressSuggestions(false);
    }
  };

  const selectAddress = (address: string) => {
    setFullAddress(address);
    setShowAddressSuggestions(false);
    
    // Extract neighborhood from address
    const neighborhoodMatch = NEIGHBORHOODS.find(n => 
      address.toLowerCase().includes(n.toLowerCase())
    );
    if (neighborhoodMatch) {
      setNeighborhood(neighborhoodMatch);
    }
  };

  const validateForm = () => {
    if (!displayName.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório.');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Erro', 'Telefone é obrigatório.');
      return false;
    }

    if (!cpf.trim()) {
      Alert.alert('Erro', 'CPF é obrigatório.');
      return false;
    }

    if (!neighborhood) {
      Alert.alert('Erro', 'Bairro é obrigatório.');
      return false;
    }

    const currentUserType = userType || userProfile?.userType;
    if (currentUserType === 'prestador' && !serviceType) {
      Alert.alert('Erro', 'Tipo de serviço é obrigatório para prestadores.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const location = await getCurrentLocation();
      
      const currentUserType = userType || userProfile?.userType;
      
      const profileData: any = {
        displayName: displayName.trim(),
        phone: phone.trim(),
        cpf: cpf.trim(),
        neighborhood,
        fullAddress: fullAddress.trim() || null,
        photoURL: photoURL || null,
        latitude: location.latitude,
        longitude: location.longitude,
        isProfileComplete: true,
      };

      if (currentUserType) {
        profileData.userType = currentUserType;
      }

      if (currentUserType === 'prestador') {
        profileData.serviceType = serviceType;
        profileData.status = 'disponivel';
        profileData.rating = 0;
        profileData.reviewCount = 0;
      }
      
      await updateUserProfile(user!.uid, profileData);
      await refreshProfile();
      
      Alert.alert(
        'Sucesso',
        'Perfil atualizado com sucesso!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erro', 'Falha ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const currentUserType = userType || userProfile?.userType;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete seu Perfil</Text>
          <Text style={styles.subtitle}>
            Preencha os dados para finalizar seu cadastro
          </Text>
          {currentUserType && (
            <View style={styles.userTypeBadge}>
              {currentUserType === 'prestador' ? (
                <Briefcase size={16} color="#2563eb" />
              ) : (
                <User size={16} color="#2563eb" />
              )}
              <Text style={styles.userTypeText}>
                {currentUserType === 'prestador' ? 'Prestador de Serviço' : 'Cliente'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={handleImageSelection}>
              <View style={styles.photoContainer}>
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Camera size={32} color="#64748b" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.photoText}>Toque para adicionar foto</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <User size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Phone size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Telefone"
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              keyboardType="phone-pad"
              maxLength={15}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* CPF Input */}
          <View style={styles.inputContainer}>
            <CreditCard size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="CPF"
              value={cpf}
              onChangeText={(text) => setCpf(formatCPF(text))}
              keyboardType="number-pad"
              maxLength={14}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Address Input with Autocomplete */}
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Endereço</Text>
            
            <View style={styles.inputContainer}>
              <Search size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Digite seu endereço completo..."
                value={fullAddress}
                onChangeText={handleAddressSearch}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {addressSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectAddress(suggestion)}
                  >
                    <MapPin size={16} color="#64748b" />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Neighborhood Selector */}
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowNeighborhoods(!showNeighborhoods)}
          >
            <MapPin size={20} color="#64748b" style={styles.inputIcon} />
            <Text style={[styles.input, styles.selectText, !neighborhood && styles.placeholder]}>
              {neighborhood || 'Selecionar bairro'}
            </Text>
          </TouchableOpacity>

          {showNeighborhoods && (
            <View style={styles.optionsContainer}>
              <ScrollView style={styles.optionsList} nestedScrollEnabled>
                {NEIGHBORHOODS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.optionItem}
                    onPress={() => {
                      setNeighborhood(item);
                      setShowNeighborhoods(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Service Type Selector (only for providers) */}
          {currentUserType === 'prestador' && (
            <>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowServices(!showServices)}
              >
                <Briefcase size={20} color="#64748b" style={styles.inputIcon} />
                <Text style={[styles.input, styles.selectText, !serviceType && styles.placeholder]}>
                  {serviceType || 'Selecionar tipo de serviço'}
                </Text>
              </TouchableOpacity>

              {showServices && (
                <View style={styles.optionsContainer}>
                  <ScrollView style={styles.optionsList} nestedScrollEnabled>
                    {SERVICES.map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={styles.optionItem}
                        onPress={() => {
                          setServiceType(service.name);
                          setShowServices(false);
                        }}
                      >
                        <Text style={styles.serviceIcon}>{service.icon}</Text>
                        <Text style={styles.optionText}>{service.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Salvando...' : 'Salvar Perfil'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  userTypeText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 8,
  },
  form: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 14,
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  addressSection: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 15,
  },
  selectText: {
    paddingVertical: 15,
  },
  placeholder: {
    color: '#94a3b8',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  optionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    maxHeight: 200,
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  serviceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});