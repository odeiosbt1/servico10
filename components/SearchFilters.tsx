import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Search, Filter, MapPin, X } from 'lucide-react-native';
import { SERVICES, NEIGHBORHOODS } from '@/constants/services';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchFiltersProps {
  onServiceFilter: (service: string) => void;
  onNeighborhoodFilter: (neighborhood: string) => void;
  onSearchText: (text: string) => void;
  onRadiusChange?: (radius: number) => void;
  selectedService?: string;
  selectedNeighborhood?: string;
  currentRadius?: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onServiceFilter,
  onNeighborhoodFilter,
  onSearchText,
  onRadiusChange,
  selectedService,
  selectedNeighborhood,
  currentRadius = 5,
}) => {
  const [searchText, setSearchText] = useState('');
  const [showServices, setShowServices] = useState(false);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [tempRadius, setTempRadius] = useState(currentRadius.toString());

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearchText(text);
  };

  const handleRadiusChange = async () => {
    const radius = parseInt(tempRadius);
    if (radius >= 1 && radius <= 50) {
      try {
        await AsyncStorage.setItem('searchRadius', radius.toString());
        onRadiusChange?.(radius);
        setShowRadiusModal(false);
      } catch (error) {
        console.error('Error saving radius:', error);
      }
    }
  };

  const radiusOptions = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50];
  
  const quickRadiusOptions = [1, 5, 10, 15, 20];
  
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por tipo de serviço..."
          value={searchText}
          onChangeText={handleSearchChange}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.radiusButton}
          onPress={() => {
            setTempRadius(currentRadius.toString());
            setShowRadiusModal(true);
          }}
        >
          <MapPin size={16} color="#2563eb" />
          <Text style={styles.radiusText}>{currentRadius}km</Text>
        </TouchableOpacity>
        
        {/* Quick Radius Options */}
        {quickRadiusOptions.map((radius) => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.quickRadiusButton,
              currentRadius === radius && styles.quickRadiusButtonActive
            ]}
            onPress={() => onRadiusChange?.(radius)}
          >
            <Text style={[
              styles.quickRadiusText,
              currentRadius === radius && styles.quickRadiusTextActive
            ]}>
              {radius}km
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.filterButton, selectedService && styles.filterButtonActive]}
          onPress={() => setShowServices(!showServices)}
        >
          <Filter size={16} color={selectedService ? 'white' : '#2563eb'} />
          <Text style={[styles.filterText, selectedService && styles.filterTextActive]}>
            {selectedService || 'Serviços'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, selectedNeighborhood && styles.filterButtonActive]}
          onPress={() => setShowNeighborhoods(!showNeighborhoods)}
        >
          <Filter size={16} color={selectedNeighborhood ? 'white' : '#2563eb'} />
          <Text style={[styles.filterText, selectedNeighborhood && styles.filterTextActive]}>
            {selectedNeighborhood || 'Bairros'}
          </Text>
        </TouchableOpacity>

        {(selectedService || selectedNeighborhood) && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onServiceFilter('');
              onNeighborhoodFilter('');
            }}
          >
            <Text style={styles.clearText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Services List */}
      {showServices && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.optionChip,
                selectedService === service.name && styles.optionChipActive
              ]}
              onPress={() => {
                onServiceFilter(service.name);
                setShowServices(false);
              }}
            >
              <Text style={styles.serviceIcon}>{service.icon}</Text>
              <Text style={[
                styles.optionText,
                selectedService === service.name && styles.optionTextActive
              ]}>
                {service.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Neighborhoods List */}
      {showNeighborhoods && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
          {NEIGHBORHOODS.map((neighborhood) => (
            <TouchableOpacity
              key={neighborhood}
              style={[
                styles.optionChip,
                selectedNeighborhood === neighborhood && styles.optionChipActive
              ]}
              onPress={() => {
                onNeighborhoodFilter(neighborhood);
                setShowNeighborhoods(false);
              }}
            >
              <Text style={[
                styles.optionText,
                selectedNeighborhood === neighborhood && styles.optionTextActive
              ]}>
                {neighborhood}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Radius Selection Modal */}
      <Modal
        visible={showRadiusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRadiusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raio de Busca</Text>
              <TouchableOpacity onPress={() => setShowRadiusModal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Selecione a distância máxima para encontrar prestadores
            </Text>
            
            <View style={styles.radiusGrid}>
              {radiusOptions.map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.radiusOption,
                    parseInt(tempRadius) === radius && styles.radiusOptionActive
                  ]}
                  onPress={() => setTempRadius(radius.toString())}
                >
                  <Text style={[
                    styles.radiusOptionText,
                    parseInt(tempRadius) === radius && styles.radiusOptionTextActive
                  ]}>
                    {radius}km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.customRadiusContainer}>
              <Text style={styles.customRadiusLabel}>Ou digite um valor personalizado (1-50km):</Text>
              <TextInput
                style={styles.customRadiusInput}
                value={tempRadius}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  if (numericValue === '' || (parseInt(numericValue) >= 1 && parseInt(numericValue) <= 50)) {
                    setTempRadius(numericValue);
                  }
                }}
                keyboardType="numeric"
                maxLength={2}
                placeholder="5"
              />
            </View>
            
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleRadiusChange}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1e293b',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  radiusText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  filterTextActive: {
    color: 'white',
  },
  clearButton: {
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  clearText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  optionsScroll: {
    marginTop: 12,
    paddingLeft: 16,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  serviceIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  optionTextActive: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  radiusOption: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 60,
    alignItems: 'center',
  },
  radiusOptionActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  radiusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  radiusOptionTextActive: {
    color: 'white',
  },
  customRadiusContainer: {
    marginBottom: 20,
  },
  customRadiusLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  customRadiusInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
  },
  applyButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickRadiusButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickRadiusButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  quickRadiusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  quickRadiusTextActive: {
    color: 'white',
  },
});