import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, MapPin, Bell, Shield, CircleHelp as HelpCircle, Info, FileSliders as Sliders } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { user, userProfile } = useAuth();
  const [searchRadius, setSearchRadius] = useState('5');
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedRadius = await AsyncStorage.getItem('searchRadius');
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedLocationSharing = await AsyncStorage.getItem('locationSharing');
      
      if (savedRadius) setSearchRadius(savedRadius);
      if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
      if (savedLocationSharing !== null) setLocationSharing(JSON.parse(savedLocationSharing));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem('searchRadius', searchRadius);
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
      await AsyncStorage.setItem('locationSharing', JSON.stringify(locationSharing));
      
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
      
      // Go back to previous screen after saving
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Erro', 'Falha ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '' || (parseInt(numericValue) >= 1 && parseInt(numericValue) <= 50)) {
      setSearchRadius(numericValue);
    }
  };

  if (!user || !userProfile) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configurações',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#2563eb" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        {/* Search Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Busca e Localização</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MapPin size={20} color="#2563eb" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Raio de Busca</Text>
                <Text style={styles.settingDescription}>
                  Distância máxima para encontrar prestadores (1-50 km)
                </Text>
              </View>
            </View>
            <View style={styles.radiusContainer}>
              <TextInput
                style={styles.radiusInput}
                value={searchRadius}
                onChangeText={handleRadiusChange}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.radiusUnit}>km</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Sliders size={20} color="#2563eb" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Compartilhar Localização</Text>
                <Text style={styles.settingDescription}>
                  Permitir que prestadores vejam sua localização aproximada
                </Text>
              </View>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
              trackColor={{ false: '#e2e8f0', true: '#2563eb' }}
              thumbColor={locationSharing ? 'white' : '#94a3b8'}
            />
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color="#2563eb" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Notificações Push</Text>
                <Text style={styles.settingDescription}>
                  Receber notificações de mensagens e atualizações
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#e2e8f0', true: '#2563eb' }}
              thumbColor={notifications ? 'white' : '#94a3b8'}
            />
          </View>
        </View>

        {/* Other Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outros</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Shield size={20} color="#2563eb" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Privacidade e Segurança</Text>
                <Text style={styles.settingDescription}>
                  Gerenciar configurações de privacidade
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <HelpCircle size={20} color="#2563eb" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Ajuda e Suporte</Text>
                <Text style={styles.settingDescription}>
                  Central de ajuda e contato
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Info size={20} color="#2563eb" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Sobre o App</Text>
                <Text style={styles.settingDescription}>
                  Versão, termos de uso e política de privacidade
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={saveSettings}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
    minWidth: 50,
  },
  radiusUnit: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    marginHorizontal: 24,
    marginVertical: 24,
    paddingVertical: 16,
    alignItems: 'center',
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